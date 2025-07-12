// 全局变量
let currentUser = null;
let selectedFiles = [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    setupEventListeners();
    
    if (currentUser && currentUser.role === 'admin') {
        showAdminPanel();
        loadUsers();
        loadInvites();
    }
});

// 设置事件监听器
function setupEventListeners() {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    
    // 文件选择
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
}

// 加载用户信息
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                currentUser = result.user;
                updateUserDisplay();
                updateQuotaDisplay();
            } else {
                // 认证失败，显示错误信息
                console.error('Authentication failed:', result);
                showAlert('认证失败，请刷新页面重试', 'error');
            }
        } else {
            // API调用失败，显示错误信息
            console.error('Failed to fetch user info, status:', response.status);
            showAlert('无法获取用户信息，请刷新页面重试', 'error');
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
        showAlert('网络错误，请刷新页面重试', 'error');
    }
}

// 更新用户显示信息
function updateUserDisplay() {
    if (!currentUser) return;
    
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-avatar').textContent = currentUser.username.charAt(0).toUpperCase();
}

// 更新配额显示
function updateQuotaDisplay() {
    if (!currentUser) return;
    
    const usedMB = (currentUser.quota.used || 0).toFixed(1);
    const totalGB = (currentUser.quota.total / 1024 / 1024 / 1024).toFixed(1);
    
    document.getElementById('used-quota').textContent = `${usedMB} MB`;
    document.getElementById('total-quota').textContent = `${totalGB} GB`;
    
    // TODO: 实际文件数量需要从API获取
    document.getElementById('file-count').textContent = '0';
}

// 显示管理员面板
function showAdminPanel() {
    document.getElementById('admin-panel').classList.add('show');
}

// 切换管理员标签
function switchAdminTab(tab) {
    // 更新按钮状态
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`admin-${tab}`).classList.add('active');
}

// 处理文件选择
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    handleFiles(files);
}

// 处理文件
function handleFiles(files) {
    selectedFiles = files;
    
    if (files.length > 0) {
        const fileNames = files.map(f => f.name).join(', ');
        document.querySelector('.upload-area p').textContent = `已选择 ${files.length} 个文件: ${fileNames}`;
    }
}

// 上传文件
async function uploadFiles() {
    if (selectedFiles.length === 0) {
        showAlert('请先选择文件', 'warning');
        return;
    }
    
    const uploadBtn = document.getElementById('upload-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = '上传中...';
    progressBar.style.display = 'block';
    
    let uploadedCount = 0;
    const totalFiles = selectedFiles.length;
    
    for (const file of selectedFiles) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // 添加用户配置的参数
            const customName = document.getElementById('custom-name').value;
            const folderPath = document.getElementById('folder-path').value;
            const nameType = document.getElementById('name-type').value;
            const uploadChannel = document.getElementById('upload-channel').value;
            
            if (customName) formData.append('customName', customName);
            if (folderPath) formData.append('uploadFolder', folderPath);
            formData.append('nameType', nameType);
            
            // 构建上传URL
            const uploadUrl = new URL('/upload', window.location.origin);
            uploadUrl.searchParams.set('uploadChannel', uploadChannel);
            uploadUrl.searchParams.set('returnFormat', 'full');
            
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (response.ok && result.success !== false) {
                uploadedCount++;
                showAlert(`文件 "${file.name}" 上传成功！链接: ${result[0].src}`, 'success');
            } else {
                if (result.error === 'FILE_EXISTS') {
                    showAlert(`文件 "${file.name}" 已存在，建议使用: ${result.suggestion}`, 'warning');
                } else {
                    showAlert(`文件 "${file.name}" 上传失败: ${result.message || '未知错误'}`, 'error');
                }
            }
        } catch (error) {
            showAlert(`文件 "${file.name}" 上传失败: ${error.message}`, 'error');
        }
        
        // 更新进度
        const progress = ((uploadedCount + (totalFiles - selectedFiles.length + selectedFiles.indexOf(file) + 1)) / totalFiles) * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    // 重置状态
    uploadBtn.disabled = false;
    uploadBtn.textContent = '开始上传';
    progressBar.style.display = 'none';
    selectedFiles = [];
    document.getElementById('file-input').value = '';
    document.querySelector('.upload-area p').innerHTML = '点击选择文件或拖拽文件到此处';
    
    // 刷新用户信息（更新配额）
    await loadUserInfo();
}

// 显示提示信息
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertContainer.appendChild(alertDiv);
    
    // 5秒后自动移除
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// 退出登录
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('退出登录失败:', error);
    } finally {
        window.location.href = '/login.html';
    }
}

// 管理员功能：加载用户列表
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayUsers(result.users);
            }
        }
    } catch (error) {
        console.error('加载用户列表失败:', error);
    }
}

// 显示用户列表
function displayUsers(users) {
    const container = document.getElementById('users-table-container');
    
    if (users.length === 0) {
        container.innerHTML = '<p>暂无用户</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>用户名</th>
                <th>角色</th>
                <th>状态</th>
                <th>配额使用</th>
                <th>文件数</th>
                <th>注册时间</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            ${users.map(user => `
                <tr>
                    <td>${user.username}</td>
                    <td><span class="badge ${user.role === 'admin' ? 'badge-success' : 'badge-warning'}">${user.role}</span></td>
                    <td><span class="badge ${user.status === 'active' ? 'badge-success' : 'badge-error'}">${user.status}</span></td>
                    <td>${(user.quota.used / 1024 / 1024).toFixed(1)}MB / ${(user.quota.total / 1024 / 1024 / 1024).toFixed(1)}GB</td>
                    <td>${user.fileCount}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        ${user.role !== 'admin' ? `
                            <button class="btn btn-secondary" onclick="resetUserPassword('${user.id}', '${user.username}')" style="margin-right: 5px;">重置密码</button>
                            <button class="btn ${user.status === 'active' ? 'btn-secondary' : 'btn-primary'}" onclick="toggleUserStatus('${user.id}', '${user.status}')">${user.status === 'active' ? '暂停' : '激活'}</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.innerHTML = '';
    container.appendChild(table);
}

// 管理员功能：加载邀请码列表
async function loadInvites() {
    try {
        const response = await fetch('/api/admin/invites', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayInvites(result.invites);
            }
        }
    } catch (error) {
        console.error('加载邀请码列表失败:', error);
    }
}

// 显示邀请码列表
function displayInvites(invites) {
    const container = document.getElementById('invites-table-container');
    
    if (invites.length === 0) {
        container.innerHTML = '<p>暂无邀请码</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>邀请码</th>
                <th>配额</th>
                <th>状态</th>
                <th>使用者</th>
                <th>创建时间</th>
                <th>过期时间</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            ${invites.map(invite => `
                <tr>
                    <td><code>${invite.code}</code></td>
                    <td>${(invite.quota / 1024 / 1024 / 1024).toFixed(1)}GB</td>
                    <td>
                        <span class="badge ${invite.isUsed ? 'badge-success' : invite.isExpired ? 'badge-error' : 'badge-warning'}">
                            ${invite.isUsed ? '已使用' : invite.isExpired ? '已过期' : '未使用'}
                        </span>
                    </td>
                    <td>${invite.usedBy || '-'}</td>
                    <td>${new Date(invite.createdAt).toLocaleDateString()}</td>
                    <td>${new Date(invite.expiresAt).toLocaleDateString()}</td>
                    <td>
                        ${!invite.isUsed ? `
                            <button class="btn btn-secondary" onclick="deleteInvite('${invite.code}')">删除</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.innerHTML = '';
    container.appendChild(table);
}

// 生成邀请码
async function generateInvite() {
    const quota = prompt('请输入配额大小（GB）:', '1');
    const expiresIn = prompt('请输入过期时间（天）:', '7');
    
    if (!quota || !expiresIn) return;
    
    const formData = new FormData();
    formData.append('quota', parseInt(quota) * 1024 * 1024 * 1024); // 转换为字节
    formData.append('expiresIn', parseInt(expiresIn) * 24 * 60 * 60); // 转换为秒
    
    try {
        const response = await fetch('/api/admin/invites', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(`邀请码生成成功: ${result.invite.code}`, 'success');
            loadInvites(); // 刷新列表
        } else {
            showAlert(`生成失败: ${result.message}`, 'error');
        }
    } catch (error) {
        showAlert('网络错误', 'error');
    }
}

// 删除邀请码
async function deleteInvite(code) {
    if (!confirm(`确定要删除邀请码 ${code} 吗？`)) return;
    
    try {
        const response = await fetch(`/api/admin/invites/${code}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('邀请码删除成功', 'success');
            loadInvites(); // 刷新列表
        } else {
            showAlert(`删除失败: ${result.message}`, 'error');
        }
    } catch (error) {
        showAlert('网络错误', 'error');
    }
}

// 重置用户密码
async function resetUserPassword(userId, username) {
    const newPassword = prompt(`请输入用户 ${username} 的新密码:`);
    if (!newPassword) return;
    
    const formData = new FormData();
    formData.append('action', 'resetPassword');
    formData.append('newPassword', newPassword);
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            body: formData,
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('密码重置成功', 'success');
        } else {
            showAlert(`重置失败: ${result.message}`, 'error');
        }
    } catch (error) {
        showAlert('网络错误', 'error');
    }
}

// 切换用户状态
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? '激活' : '暂停';
    
    if (!confirm(`确定要${action}该用户吗？`)) return;
    
    const formData = new FormData();
    formData.append('action', 'updateStatus');
    formData.append('status', newStatus);
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            body: formData,
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(`用户${action}成功`, 'success');
            loadUsers(); // 刷新列表
        } else {
            showAlert(`${action}失败: ${result.message}`, 'error');
        }
    } catch (error) {
        showAlert('网络错误', 'error');
    }
}