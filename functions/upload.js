import { errorHandling, telemetryData } from "./utils/middleware";
import { fetchUploadConfig, fetchSecurityConfig } from "./utils/sysConfig";
import { purgeCFCache } from "./utils/purgeCache";
import { getCurrentUser, createAuthResponse } from "./utils/auth.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let uploadConfig = {};
let securityConfig = {};
let uploadModerate = null;

// 统一的响应创建函数
function createResponse(body, options = {}) {
    const defaultHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
    
    return new Response(body, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });
}

// 更新用户配额
async function updateUserQuota(env, userResult, fileSizeMB) {
    try {
        const userData = JSON.parse(await env.img_url.get(`users:${userResult.userId}`));
        userData.quota.used += fileSizeMB;
        await env.img_url.put(`users:${userResult.userId}`, JSON.stringify(userData));
    } catch (error) {
        console.error('Failed to update user quota:', error);
    }
}

// 检查文件名是否已存在
async function checkFileExists(env, fullPath) {
    const exists = await env.img_url.get(fullPath);
    if (exists) {
        const ext = fullPath.split('.').pop();
        const nameWithoutExt = fullPath.replace(`.${ext}`, '');
        const timestamp = Date.now();
        const suggestion = `${nameWithoutExt}_${timestamp}.${ext}`;
        
        return {
            exists: true,
            suggestion: suggestion
        };
    }
    return { exists: false };
}

// 处理自定义文件名
function getCustomFileName(originalName, customName, nameType) {
    const ext = originalName.split('.').pop();
    
    switch (nameType) {
        case 'custom':
            if (customName && customName.trim()) {
                // 确保自定义文件名有正确的扩展名
                const customExt = customName.split('.').pop();
                if (customExt === customName || !isExtValid(customExt)) {
                    return `${customName.trim()}.${ext}`;
                }
                return customName.trim();
            }
            return originalName;
        case 'index':
            const timestamp = Date.now() + Math.floor(Math.random() * 10000);
            return `${timestamp}.${ext}`;
        case 'short':
            const shortId = generateShortId(8);
            return `${shortId}.${ext}`;
        case 'origin':
        default:
            return originalName;
    }
}

export async function onRequestPost(context) {  // Contents of context object
    const { request, env, params, waitUntil, next, data } = context;

    const url = new URL(request.url);
    const clonedRequest = await request.clone();

    // 用户认证
    const userResult = await getCurrentUser(env, request);
    if (!userResult.success) {
        return createAuthResponse(JSON.stringify({
            success: false,
            error: 'NOT_AUTHENTICATED',
            message: '请先登录'
        }), { status: 401 });
    }

    const currentUser = userResult.userData;
    const userId = userResult.userId;

    // 读取安全配置
    securityConfig = await fetchSecurityConfig(env);
    uploadModerate = securityConfig.upload.moderate;

    // 获得上传IP
    const uploadIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || request.headers.get("x-client-ip") || request.headers.get("x-host") || request.headers.get("x-originating-ip") || request.headers.get("x-cluster-client-ip") || request.headers.get("forwarded-for") || request.headers.get("forwarded") || request.headers.get("via") || request.headers.get("requester") || request.headers.get("true-client-ip") || request.headers.get("client-ip") || request.headers.get("x-remote-ip") || request.headers.get("x-originating-ip") || request.headers.get("fastly-client-ip") || request.headers.get("akamai-origin-hop") || request.headers.get("x-remote-ip") || request.headers.get("x-remote-addr") || request.headers.get("x-remote-host") || request.headers.get("x-client-ip") || request.headers.get("x-client-ips") || request.headers.get("x-client-ip")
    // 判断上传ip是否被封禁
    const isBlockedIp = await isBlockedUploadIp(env, uploadIp);
    if (isBlockedIp) {
        return createResponse('Error: Your IP is blocked', { status: 403 });
    }
    // 获取IP地址
    const ipAddress = await getIPAddress(uploadIp);

    // 读取上传配置
    uploadConfig = await fetchUploadConfig(env);

    // 获得上传渠道
    const urlParamUploadChannel = url.searchParams.get('uploadChannel');
    // 获取上传文件夹路径
    let uploadFolder = url.searchParams.get('uploadFolder') || '';

    let uploadChannel = 'TelegramNew';
    switch (urlParamUploadChannel) {
        case 'telegram':
            uploadChannel = 'TelegramNew';
            break;
        case 'cfr2':
            uploadChannel = 'CloudflareR2';
            break;
        case 's3':
            uploadChannel = 'S3';
            break;
        case 'external':
            uploadChannel = 'External';
            break;
        default:
            uploadChannel = 'TelegramNew';
            break;
    }
    
    // 错误处理和遥测
    if (env.dev_mode === undefined || env.dev_mode === null || env.dev_mode !== 'true') {
        await errorHandling(context);
        telemetryData(context);
    }

    // img_url 未定义或为空的处理逻辑
    if (typeof env.img_url == "undefined" || env.img_url == null || env.img_url == "") {
        return createResponse('Error: Please configure KV database', { status: 500 });
    } 

    // 获取文件信息
    const time = new Date().getTime();
    const formdata = await clonedRequest.formData();
    
    // 检查用户配额
    const fileSizeMB = (formdata.get('file').size / 1024 / 1024);
    if (currentUser.quota.used + fileSizeMB > (currentUser.quota.total / 1024 / 1024)) {
        return createResponse(JSON.stringify({
            success: false,
            error: 'QUOTA_EXCEEDED',
            message: '存储配额不足'
        }), { status: 403 });
    }
    const fileType = formdata.get('file').type;
    let fileName = formdata.get('file').name;
    const fileSize = fileSizeMB.toFixed(2); // 文件大小，单位MB
    
    // 获取自定义参数
    const customName = formdata.get('customName') || '';
    const nameType = formdata.get('nameType') || 'origin';
    
    // 检查fileType和fileName是否存在
    if (fileType === null || fileType === undefined || fileName === null || fileName === undefined) {
        return createResponse(JSON.stringify({
            success: false,
            error: 'INVALID_FILE',
            message: '文件信息不完整'
        }), { status: 400 });
    }

    // 处理文件名，移除特殊字符
    fileName = sanitizeFileName(fileName);
    
    // 根据命名类型获取最终文件名
    const finalFileName = getCustomFileName(fileName, customName, nameType);
    
    // 处理文件夹路径
    if (uploadFolder === '' || uploadFolder === null || uploadFolder === undefined) {
        uploadFolder = 'root'; // 默认文件夹
    }
    
    // 处理文件夹路径格式，确保安全
    const normalizedFolder = uploadFolder
        .replace(/^\/+/, '') // 移除开头的/
        .replace(/\/{2,}/g, '/') // 替换多个连续的/为单个/
        .replace(/\/$/, '') // 移除末尾的/
        .replace(/\.\./g, '') // 移除../防止路径遍历
        || 'root';
    
    // 限制文件夹深度
    const folderDepth = normalizedFolder.split('/').length;
    if (folderDepth > 3) {
        return createResponse(JSON.stringify({
            success: false,
            error: 'FOLDER_TOO_DEEP',
            message: '文件夹嵌套深度不能超过3层'
        }), { status: 400 });
    }
    
    // 构建完整文件路径：/{userId}/{folder}/{filename}
    const fullPath = `${userId}/${normalizedFolder}/${finalFileName}`;
    
    // 检查文件是否已存在
    const fileExistsResult = await checkFileExists(env, fullPath);
    if (fileExistsResult.exists) {
        return createResponse(JSON.stringify({
            success: false,
            error: 'FILE_EXISTS',
            message: `文件名 '${finalFileName}' 已存在`,
            suggestion: fileExistsResult.suggestion.split('/').pop() // 只返回文件名部分
        }), { status: 409 });
    }

    const metadata = {
        FileName: finalFileName,
        OriginalName: fileName,
        FileType: fileType,
        FileSize: fileSize,
        UploadIP: uploadIp,
        UploadAddress: ipAddress,
        ListType: "None",
        TimeStamp: time,
        Label: "None",
        Folder: normalizedFolder,
        ownerId: userId, // 文件所有者
    }


    let fileExt = finalFileName.split('.').pop(); // 文件扩展名
    if (!isExtValid(fileExt)) {
        // 如果文件名中没有扩展名，尝试从文件类型中获取
        fileExt = fileType.split('/').pop();
        if (fileExt === fileType || fileExt === '' || fileExt === null || fileExt === undefined) {
            // Type中无法获取扩展名
            fileExt = 'unknown' // 默认扩展名
        }
    }

    // 使用完整路径作为文件ID
    const fullId = fullPath;

    // 获得返回链接格式, default为返回/file/id, full为返回完整链接
    const returnFormat = url.searchParams.get('returnFormat') || 'default';
    let returnLink = '';
    if (returnFormat === 'full') {
        returnLink = `${url.origin}/file/${fullId}`;
    } else {
        returnLink = `/file/${fullId}`;
    }

    // 清除CDN缓存
    const cdnUrl = `https://${url.hostname}/file/${fullId}`;
    await purgeCDNCache(env, cdnUrl, url, normalizedFolder);
   

    // ====================================不同渠道上传=======================================
    // 出错是否切换渠道自动重试，默认开启
    const autoRetry = url.searchParams.get('autoRetry') === 'false' ? false : true;

    let err = '';
    // 上传到不同渠道
    if (uploadChannel === 'CloudflareR2') {
        // -------------CloudFlare R2 渠道---------------
        const res = await uploadFileToCloudflareR2(env, formdata, fullId, metadata, returnLink, url, userResult);
        if (res.status === 200 || !autoRetry) {
            return res;
        } else {
            err = await res.text();
        }
    } else if (uploadChannel === 'S3') {
        // ---------------------S3 渠道------------------
        const res = await uploadFileToS3(env, formdata, fullId, metadata, returnLink, url, userResult);
        if (res.status === 200 || !autoRetry) {
            return res;
        } else {
            err = await res.text();
        }
    } else if (uploadChannel === 'External') {
        // --------------------外链渠道----------------------
        const res = await uploadFileToExternal(env, formdata, fullId, metadata, returnLink, url, userResult);
        return res;
    } else {
        // ----------------Telegram New 渠道-------------------
        const res = await uploadFileToTelegram(env, formdata, fullId, metadata, fileExt, finalFileName, fileType, url, clonedRequest, returnLink, userResult);
        if (res.status === 200 || !autoRetry) {
            return res;
        } else {
            err = await res.text();
        }
    }

    // 上传失败，开始自动切换渠道重试
    const res = await tryRetry(err, env, uploadChannel, formdata, fullId, metadata, fileExt, finalFileName, fileType, url, clonedRequest, returnLink, userResult);
    return res;
}


// 自动切换渠道重试
async function tryRetry(err, env, uploadChannel, formdata, fullId, metadata, fileExt, fileName, fileType, url, clonedRequest, returnLink, userResult) {
    // 渠道列表
    const channelList = ['CloudflareR2', 'TelegramNew', 'S3'];
    const errMessages = {};
    errMessages[uploadChannel] = 'Error: ' + uploadChannel + err;
    for (let i = 0; i < channelList.length; i++) {
        if (channelList[i] !== uploadChannel) {
            let res = null;
            if (channelList[i] === 'CloudflareR2') {
                res = await uploadFileToCloudflareR2(env, formdata, fullId, metadata, returnLink, url, userResult);
            } else if (channelList[i] === 'TelegramNew') {
                res = await uploadFileToTelegram(env, formdata, fullId, metadata, fileExt, fileName, fileType, url, clonedRequest, returnLink, userResult);
            } else if (channelList[i] === 'S3') {
                res = await uploadFileToS3(env, formdata, fullId, metadata, returnLink, url, userResult);
            }

            if (res.status === 200) {
                return res;
            } else {
                errMessages[channelList[i]] = 'Error: ' + channelList[i] + await res.text();
            }
        }
    }

    return createResponse(JSON.stringify(errMessages), { status: 500 });
}


// 上传到Cloudflare R2
async function uploadFileToCloudflareR2(env, formdata, fullId, metadata, returnLink, originUrl, userResult) {
    // 检查R2数据库是否配置
    if (typeof env.img_r2 == "undefined" || env.img_r2 == null || env.img_r2 == "") {
        return createResponse('Error: Please configure R2 database', { status: 500 });
    }
    // 检查 R2 渠道是否启用
    const r2Settings = uploadConfig.cfr2;
    if (!r2Settings.channels || r2Settings.channels.length === 0) {
        return createResponse('Error: No R2 channel provided', { status: 400 });
    }

    const r2Channel = r2Settings.channels[0];
    
    const R2DataBase = env.img_r2;

    // 写入R2数据库
    await R2DataBase.put(fullId, formdata.get('file'));

    // 更新metadata
    metadata.Channel = "CloudflareR2";
    metadata.ChannelName = "R2_env";

    // 图像审查，采用R2的publicUrl
    const R2PublicUrl = r2Channel.publicUrl;
    let moderateUrl = `${R2PublicUrl}/${fullId}`;
    metadata = await moderateContent(env, moderateUrl, metadata);

    // 写入KV数据库
    try {
        await env.img_url.put(fullId, "", {
            metadata: metadata,
        });
        
        // 更新用户配额
        await updateUserQuota(env, userResult, parseFloat(metadata.FileSize));
    } catch (error) {
        return createResponse('Error: Failed to write to KV database', { status: 500 });
    }


    // 成功上传，将文件ID返回给客户端
    return createResponse(
        JSON.stringify([{ 'src': `${returnLink}` }]), 
        {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
            }
        }
    );
}



// 上传到 S3（支持自定义端点）
async function uploadFileToS3(env, formdata, fullId, metadata, returnLink, originUrl, userResult) {
    const s3Settings = uploadConfig.s3;
    const s3Channels = s3Settings.channels;
    const s3Channel = s3Settings.loadBalance.enabled
        ? s3Channels[Math.floor(Math.random() * s3Channels.length)]
        : s3Channels[0];

    if (!s3Channel) {
        return createResponse('Error: No S3 channel provided', { status: 400 });
    }

    const { endpoint, pathStyle, accessKeyId, secretAccessKey, bucketName, region } = s3Channel;

    // 创建 S3 客户端
    const s3Client = new S3Client({
        region: region || "auto", // R2 可用 "auto"
        endpoint, // 自定义 S3 端点
        credentials: {
            accessKeyId,
            secretAccessKey
        },
        forcePathStyle: pathStyle // 是否启用路径风格
    });

    // 获取文件
    const file = formdata.get("file");
    if (!file) return createResponse("Error: No file provided", { status: 400 });

    // 转换 Blob 为 Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const s3FileName = fullId;

    try {
        // S3 上传参数
        const putObjectParams = {
            Bucket: bucketName,
            Key: s3FileName,
            Body: uint8Array, // 直接使用 Blob
            ContentType: file.type
        };

        // 执行上传
        await s3Client.send(new PutObjectCommand(putObjectParams));

        // 更新 metadata
        metadata.Channel = "S3";
        metadata.ChannelName = s3Channel.name;

        const s3ServerDomain = endpoint.replace(/https?:\/\//, "");
        if (pathStyle) {
            metadata.S3Location = `https://${s3ServerDomain}/${bucketName}/${s3FileName}`; // 采用路径风格的 URL
        } else {
            metadata.S3Location = `https://${bucketName}.${s3ServerDomain}/${s3FileName}`; // 采用虚拟主机风格的 URL
        }
        metadata.S3Endpoint = endpoint;
        metadata.S3PathStyle = pathStyle;
        metadata.S3AccessKeyId = accessKeyId;
        metadata.S3SecretAccessKey = secretAccessKey;
        metadata.S3Region = region || "auto";
        metadata.S3BucketName = bucketName;
        metadata.S3FileKey = s3FileName;

        // 图像审查
        if (uploadModerate && uploadModerate.enabled) {
            try {
                await env.img_url.put(fullId, "", { metadata });
            } catch {
                return createResponse("Error: Failed to write to KV database", { status: 500 });
            }

            const moderateUrl = `https://${originUrl.hostname}/file/${fullId}`;
            metadata = await moderateContent(env, moderateUrl, metadata);
            await purgeCDNCache(env, moderateUrl, originUrl);
        }

        // 写入 KV 数据库
        try {
            await env.img_url.put(fullId, "", { metadata });
            
            // 更新用户配额
            await updateUserQuota(env, userResult, parseFloat(metadata.FileSize));
        } catch {
            return createResponse("Error: Failed to write to KV database", { status: 500 });
        }

        return createResponse(JSON.stringify([{ src: returnLink }]), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        return createResponse(`Error: Failed to upload to S3 - ${error.message}`, { status: 500 });
    }
}

// 上传到Telegram
async function uploadFileToTelegram(env, formdata, fullId, metadata, fileExt, fileName, fileType, url, clonedRequest, returnLink, userResult) {
    // 选择一个 Telegram 渠道上传，若负载均衡开启，则随机选择一个；否则选择第一个
    const tgSettings = uploadConfig.telegram;
    const tgChannels = tgSettings.channels;
    const tgChannel = tgSettings.loadBalance.enabled? tgChannels[Math.floor(Math.random() * tgChannels.length)] : tgChannels[0];
    if (!tgChannel) {
        return createResponse('Error: No Telegram channel provided', { status: 400 });
    }

    const tgBotToken = tgChannel.botToken;
    const tgChatId = tgChannel.chatId;

    // 由于TG会把gif后缀的文件转为视频，所以需要修改后缀名绕过限制
    if (fileExt === 'gif') {
        const newFileName = fileName.replace(/\.gif$/, '.jpeg');
        const newFile = new File([formdata.get('file')], newFileName, { type: fileType });
        formdata.set('file', newFile);
    } else if (fileExt === 'webp') {
        const newFileName = fileName.replace(/\.webp$/, '.jpeg');
        const newFile = new File([formdata.get('file')], newFileName, { type: fileType });
        formdata.set('file', newFile);
    }

    // 选择对应的发送接口
    const fileTypeMap = {
        'image/': {'url': 'sendPhoto', 'type': 'photo'},
        'video/': {'url': 'sendVideo', 'type': 'video'},
        'audio/': {'url': 'sendAudio', 'type': 'audio'},
        'application/pdf': {'url': 'sendDocument', 'type': 'document'},
    };

    const defaultType = {'url': 'sendDocument', 'type': 'document'};

    let sendFunction = Object.keys(fileTypeMap).find(key => fileType.startsWith(key)) 
        ? fileTypeMap[Object.keys(fileTypeMap).find(key => fileType.startsWith(key))] 
        : defaultType;

    // GIF 发送接口特殊处理
    if (fileType === 'image/gif' || fileType === 'image/webp' || fileExt === 'gif' || fileExt === 'webp') {
        sendFunction = {'url': 'sendAnimation', 'type': 'animation'};
    }

    // 根据服务端压缩设置处理接口：从参数中获取serverCompress，如果为false，则使用sendDocument接口
    if (url.searchParams.get('serverCompress') === 'false') {
        sendFunction = {'url': 'sendDocument', 'type': 'document'};
    }

    // 根据发送接口向表单嵌入chat_id
    let newFormdata = new FormData();
    newFormdata.append('chat_id', tgChatId);
    newFormdata.append(sendFunction.type, formdata.get('file'));

    
    // 构建目标 URL 
    // const targetUrl = new URL(url.pathname, 'https://telegra.ph'); // telegraph接口，已失效，缅怀
    const targetUrl = new URL(`https://api.telegram.org/bot${tgBotToken}/${sendFunction.url}`); // telegram接口
    // 目标 URL 剔除 authCode 参数
    url.searchParams.forEach((value, key) => {
        if (key !== 'authCode') {
            targetUrl.searchParams.append(key, value);
        }
    });
    // 复制请求头并剔除 authCode
    const headers = new Headers(clonedRequest.headers);
    headers.delete('authCode');


    // 向目标 URL 发送请求
    let res = createResponse('upload error, check your environment params about telegram channel!', { status: 400 });
    try {
        const response = await fetch(targetUrl.href, {
            method: clonedRequest.method,
            headers: {
                "User-Agent": " Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0"
            },
            body: newFormdata,
        });
        const clonedRes = await response.clone().json(); // 等待响应克隆和解析完成
        const fileInfo = getFile(clonedRes);
        const filePath = await getFilePath(tgBotToken, fileInfo.file_id);
        const id = fileInfo.file_id;
        // 更新FileSize
        metadata.FileSize = (fileInfo.file_size / 1024 / 1024).toFixed(2);

        // 若上传成功，将响应返回给客户端
        if (response.ok) {
            res = createResponse(
                JSON.stringify([{ 'src': `${returnLink}` }]),
                {
                    status: 200,
                    headers: { 
                        'Content-Type': 'application/json',
                    }
                }
            );
        }


        // 图像审查
        const moderateUrl = `https://api.telegram.org/file/bot${tgBotToken}/${filePath}`;
        metadata = await moderateContent(env, moderateUrl, metadata);

        // 更新metadata，写入KV数据库
        try {
            metadata.Channel = "TelegramNew";
            metadata.ChannelName = tgChannel.name;

            metadata.TgFileId = id;
            metadata.TgChatId = tgChatId;
            metadata.TgBotToken = tgBotToken;
            await env.img_url.put(fullId, "", {
                metadata: metadata,
            });
            
            // 更新用户配额
            await updateUserQuota(env, userResult, parseFloat(metadata.FileSize));
        } catch (error) {
            res = createResponse('Error: Failed to write to KV database', { status: 500 });
        }
    } catch (error) {
        res = createResponse('upload error, check your environment params about telegram channel!', { status: 400 });
    } finally {
        return res;
    }
}


// 外链渠道
async function uploadFileToExternal(env, formdata, fullId, metadata, returnLink, originUrl, userResult) {
    // 直接将外链写入metadata
    metadata.Channel = "External";
    metadata.ChannelName = "External";
    // 从 formdata 中获取外链
    const extUrl = formdata.get('url');
    if (extUrl === null || extUrl === undefined) {
        return createResponse('Error: No url provided', { status: 400 });
    }
    metadata.ExternalLink = extUrl;
    // 写入KV数据库
    try {
        await env.img_url.put(fullId, "", {
            metadata: metadata,
        });
        
        // 更新用户配额
        await updateUserQuota(env, userResult, parseFloat(metadata.FileSize));
    } catch (error) {
        return createResponse('Error: Failed to write to KV database', { status: 500 });
    }

    // 返回结果
    return createResponse(
        JSON.stringify([{ 'src': `${returnLink}` }]), 
        {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
            }
        }
    );
}


// 图像审查
async function moderateContent(env, url, metadata) {
    const enableModerate = uploadModerate && uploadModerate.enabled;

    // 如果未启用审查，直接返回metadata
    if (!enableModerate) {
        metadata.Label = "None";
        return metadata;
    }

    // moderatecontent.com 渠道
    if (uploadModerate.channel === 'moderatecontent.com') {
        const apikey = securityConfig.upload.moderate.moderateContentApiKey;
        if (apikey == undefined || apikey == null || apikey == "") {
            metadata.Label = "None";
        } else {
            try {
                const fetchResponse = await fetch(`https://api.moderatecontent.com/moderate/?key=${apikey}&url=${url}`);
                if (!fetchResponse.ok) {
                    throw new Error(`HTTP error! status: ${fetchResponse.status}`);
                }
                const moderate_data = await fetchResponse.json();
                if (moderate_data.rating_label) {
                    metadata.Label = moderate_data.rating_label;
                }
            } catch (error) {
                console.error('Moderate Error:', error);
                // 将不带审查的图片写入数据库
                metadata.Label = "None";
            }
        }
        return metadata;
    }

    // nsfw 渠道 和 默认渠道
    if (uploadModerate.channel === 'nsfwjs' || uploadModerate.channel === 'default') {
        const defaultApiPath = 'https://nsfwjs.1314883.xyz';
        const nsfwApiPath = uploadModerate.channel === 'default' ? defaultApiPath : securityConfig.upload.moderate.nsfwApiPath;

        try {
            const fetchResponse = await fetch(`${nsfwApiPath}?url=${encodeURIComponent(url)}`);
            if (!fetchResponse.ok) {
                throw new Error(`HTTP error! status: ${fetchResponse.status}`);
            }
            const moderate_data = await fetchResponse.json();

            const score = moderate_data.score || 0;
            if (score >= 0.9) {
                metadata.Label = "adult";
            } else if (score >= 0.7) {
                metadata.Label = "teen";
            } else {
                metadata.Label = "everyone";
            }
        } catch (error) {
            console.error('Moderate Error:', error);
            // 将不带审查的图片写入数据库
            metadata.Label = "None";
        } 

        return metadata;
    }

    metadata.Label = "None";
    return metadata; // 如果没有匹配到任何渠道，直接返回metadata
}

function getFile(response) {
    try {
		if (!response.ok) {
			return null;
		}

		const getFileDetails = (file) => ({
			file_id: file.file_id,
			file_name: file.file_name || file.file_unique_id,
            file_size: file.file_size,
		});

		if (response.result.photo) {
			const largestPhoto = response.result.photo.reduce((prev, current) =>
				(prev.file_size > current.file_size) ? prev : current
			);
			return getFileDetails(largestPhoto);
		}

		if (response.result.video) {
			return getFileDetails(response.result.video);
		}

        if (response.result.audio) {
            return getFileDetails(response.result.audio);
        }

		if (response.result.document) {
			return getFileDetails(response.result.document);
		}

		return null;
	} catch (error) {
		console.error('Error getting file id:', error.message);
		return null;
	}
}

async function getFilePath(bot_token, file_id) {
    try {
        const url = `https://api.telegram.org/bot${bot_token}/getFile?file_id=${file_id}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            "User-Agent": " Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome"
          },
        })
    
        let responseData = await res.json();
        if (responseData.ok) {
          const file_path = responseData.result.file_path
          return file_path
        } else {
          return null;
        }
      } catch (error) {
        return null;
      }
}

async function purgeCDNCache(env, cdnUrl, url, normalizedFolder) {
    if (env.dev_mode === 'true') {
        return;
    }

    // 清除CDN缓存
    try {
        await purgeCFCache(env, cdnUrl);
    } catch (error) {
        console.error('Failed to clear CDN cache:', error);
    }

    // 清除api/randomFileList API缓存
    try {
        const cache = caches.default;
        // await cache.delete(`${url.origin}/api/randomFileList`); delete有bug，通过写入一个max-age=0的response来清除缓存
        const nullResponse = new Response(null, {
            headers: { 'Cache-Control': 'max-age=0' },
        });

        await cache.put(`${url.origin}/api/randomFileList?dir=${normalizedFolder}`, nullResponse);
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
}

function isExtValid(fileExt) {
    return ['jpeg', 'jpg', 'png', 'gif', 'webp', 
    'mp4', 'mp3', 'ogg',
    'mp3', 'wav', 'flac', 'aac', 'opus',
    'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'pdf', 
    'txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'go', 'java', 'php', 'py', 'rb', 'sh', 'bat', 'cmd', 'ps1', 'psm1', 'psd', 'ai', 'sketch', 'fig', 'svg', 'eps', 'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'apk', 'exe', 'msi', 'dmg', 'iso', 'torrent', 'webp', 'ico', 'svg', 'ttf', 'otf', 'woff', 'woff2', 'eot', 'apk', 'crx', 'xpi', 'deb', 'rpm', 'jar', 'war', 'ear', 'img', 'iso', 'vdi', 'ova', 'ovf', 'qcow2', 'vmdk', 'vhd', 'vhdx', 'pvm', 'dsk', 'hdd', 'bin', 'cue', 'mds', 'mdf', 'nrg', 'ccd', 'cif', 'c2d', 'daa', 'b6t', 'b5t', 'bwt', 'isz', 'isz', 'cdi', 'flp', 'uif', 'xdi', 'sdi'
    ].includes(fileExt);
}

// 处理文件名中的特殊字符
function sanitizeFileName(fileName) {
    fileName = decodeURIComponent(fileName);
    fileName = fileName.split('/').pop();

    const unsafeCharsRe = /[\\\/:\*\?"'<>\| \(\)\[\]\{\}#%\^`~;@&=\+\$,]/g;
    return fileName.replace(unsafeCharsRe, '_');
}

// 检查上传IP是否被封禁
async function isBlockedUploadIp(env, uploadIp) {
    // 检查是否配置了KV数据库
    if (typeof env.img_url == "undefined" || env.img_url == null || env.img_url == "") {
        return false;
    }

    const kv = env.img_url;
    let list = await kv.get("manage@blockipList");
    if (list == null) {
        list = [];
    } else {
        list = list.split(",");
    }

    return list.includes(uploadIp);
}

// 生成短链接
function generateShortId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


// 获取IP地址
async function getIPAddress(ip) {
    let address = '未知';
    try {
        const ipInfo = await fetch(`https://apimobile.meituan.com/locate/v2/ip/loc?rgeo=true&ip=${ip}`);
        const ipData = await ipInfo.json();
        
        if (ipInfo.ok && ipData.data) {
            const lng = ipData.data?.lng || 0;
            const lat = ipData.data?.lat || 0;
            
            // 读取具体地址
            const addressInfo = await fetch(`https://apimobile.meituan.com/group/v1/city/latlng/${lat},${lng}?tag=0`);
            const addressData = await addressInfo.json();

            if (addressInfo.ok && addressData.data) {
                // 根据各字段是否存在，拼接地址
                address = [
                    addressData.data.detail,
                    addressData.data.city,
                    addressData.data.province,
                    addressData.data.country
                ].filter(Boolean).join(', ');
            }
        }
    } catch (error) {
        console.error('Error fetching IP address:', error);
    }
    return address;
}

// 构建唯一文件ID
async function buildUniqueFileId(env, nameType, normalizedFolder, fileName, fileExt, time) {
    const unique_index = time + Math.floor(Math.random() * 10000);
    let baseId = '';
    
    // 根据命名方式构建基础ID
    if (nameType === 'index') {
        baseId = normalizedFolder ? `${normalizedFolder}/${unique_index}.${fileExt}` : `${unique_index}.${fileExt}`;
    } else if (nameType === 'origin') {
        baseId = normalizedFolder ? `${normalizedFolder}/${fileName}` : fileName;
    } else if (nameType === 'short') {
        // 对于短链接，直接在循环中生成不重复的ID
        while (true) {
            const shortId = generateShortId(8);
            const testFullId = normalizedFolder ? `${normalizedFolder}/${shortId}.${fileExt}` : `${shortId}.${fileExt}`;
            if (await env.img_url.get(testFullId) === null) {
                return testFullId;
            }
        }
    } else {
        baseId = normalizedFolder ? `${normalizedFolder}/${unique_index}_${fileName}` : `${unique_index}_${fileName}`;
    }
    
    // 检查基础ID是否已存在
    if (await env.img_url.get(baseId) === null) {
        return baseId;
    }
    
    // 如果已存在，在文件名后面加上递增编号
    let counter = 1;
    while (true) {
        let duplicateId;
        
        if (nameType === 'index') {
            const baseName = unique_index;
            duplicateId = normalizedFolder ? 
                `${normalizedFolder}/${baseName}(${counter}).${fileExt}` : 
                `${baseName}(${counter}).${fileExt}`;
        } else if (nameType === 'origin') {
            const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
            const ext = fileName.substring(fileName.lastIndexOf('.'));
            duplicateId = normalizedFolder ? 
                `${normalizedFolder}/${nameWithoutExt}(${counter})${ext}` : 
                `${nameWithoutExt}(${counter})${ext}`;
        } else {
            const baseName = `${unique_index}_${fileName}`;
            const nameWithoutExt = baseName.substring(0, baseName.lastIndexOf('.'));
            const ext = baseName.substring(baseName.lastIndexOf('.'));
            duplicateId = normalizedFolder ? 
                `${normalizedFolder}/${nameWithoutExt}(${counter})${ext}` : 
                `${nameWithoutExt}(${counter})${ext}`;
        }
        
        // 检查新ID是否已存在
        if (await env.img_url.get(duplicateId) === null) {
            return duplicateId;
        }
        
        counter++;
        
        // 防止无限循环，最多尝试1000次
        if (counter > 1000) {
            throw new Error('无法生成唯一的文件ID');
        }
    }
}