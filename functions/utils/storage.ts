// functions/utils/storage.ts
import { Env, FileMetadata } from '../types';

export async function uploadToR2(
  env: Env, 
  file: File, 
  key: string
): Promise<void> {
  await env.IMAGE_HOST_R2.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      contentDisposition: `attachment; filename="${file.name}"`
    }
  });
}

export async function deleteFromR2(env: Env, key: string): Promise<void> {
  await env.IMAGE_HOST_R2.delete(key);
}

export async function getFromR2(env: Env, key: string): Promise<R2Object | null> {
  return await env.IMAGE_HOST_R2.get(key);
}

export function generateFileUrl(publicDomain: string, key: string): string {
  return `${publicDomain}/${key}`;
}

export function generateStorageKey(userId: string, filename: string, folderPath?: string): string {
  const basePath = folderPath ? `${folderPath}/` : '';
  return `${userId}/${basePath}${filename}`;
}

export function extractStorageKeyInfo(key: string): {
  userId: string;
  folderPath?: string;
  filename: string;
} {
  const parts = key.split('/');
  const userId = parts[0];
  const filename = parts[parts.length - 1];
  const folderPath = parts.length > 2 ? parts.slice(1, -1).join('/') : undefined;
  
  return { userId, folderPath, filename };
}

export async function calculateUserStorageUsed(env: Env, userId: string): Promise<number> {
  let totalUsed = 0;
  const fileKeys = await env.IMAGE_HOST_KV.list({ prefix: `file:${userId}:` });
  
  for (const key of fileKeys.keys) {
    const fileData = await env.IMAGE_HOST_KV.get(key.name);
    if (fileData) {
      const file: FileMetadata = JSON.parse(fileData);
      totalUsed += file.size;
    }
  }
  
  return totalUsed;
}