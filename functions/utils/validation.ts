// functions/utils/validation.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateUsername(username: string): boolean {
  return username.length >= 3 && 
         username.length <= 20 && 
         /^[a-zA-Z0-9_]+$/.test(username);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6 && password.length <= 128;
}

export function validateInviteCode(code: string): boolean {
  return code.length >= 8 && code.length <= 32 && /^[A-Z0-9]+$/.test(code);
}

export function sanitizeFilename(filename: string): string {
  // 保留文件扩展名，但清理文件名
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  // 替换不安全字符，保留中文字符
  const sanitizedName = name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 200);
    
  return sanitizedName + extension;
}

export function validateFileType(type: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(allowed => {
    if (allowed.endsWith('/*')) {
      return type.startsWith(allowed.slice(0, -1));
    }
    if (allowed.startsWith('.')) {
      // 文件扩展名匹配
      return type.includes(allowed.toLowerCase());
    }
    return type === allowed;
  });
}

export function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

export function validateStorageQuota(quota: number): boolean {
  const minQuota = 1024 * 1024; // 1MB
  const maxQuota = 1024 * 1024 * 1024 * 1000; // 1TB
  return quota >= minQuota && quota <= maxQuota;
}

export function validateFolderName(name: string): boolean {
  return name.length >= 1 && 
         name.length <= 100 && 
         !/[<>:"/\\|?*\x00-\x1f]/.test(name) &&
         name !== '.' && 
         name !== '..';
}

export function validateShareOptions(options: {
  password?: string;
  expiresAt?: string;
  maxViews?: number;
}): string[] {
  const errors: string[] = [];
  
  if (options.password && options.password.length < 4) {
    errors.push('Share password must be at least 4 characters');
  }
  
  if (options.expiresAt) {
    const expiryDate = new Date(options.expiresAt);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      errors.push('Expiry date must be a valid future date');
    }
  }
  
  if (options.maxViews && (options.maxViews < 1 || options.maxViews > 10000)) {
    errors.push('Max views must be between 1 and 10000');
  }
  
  return errors;
}