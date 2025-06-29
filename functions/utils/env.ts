// functions/utils/env.ts
import { Env } from '../types';

export function getEnvConfig(env: Env) {
  const config = {
    jwtSecret: env.JWT_SECRET,
    r2BucketName: env.R2_BUCKET_NAME,
    r2AccountId: env.R2_ACCOUNT_ID,
    r2AccessKey: env.R2_ACCESS_KEY_ID,
    r2SecretKey: env.R2_SECRET_ACCESS_KEY,
    r2PublicDomain: env.R2_PUBLIC_DOMAIN,
    siteDomain: env.SITE_DOMAIN,
    defaultStorageQuota: parseInt(env.DEFAULT_STORAGE_QUOTA || '5368709120'),
    maxFileSize: parseInt(env.MAX_FILE_SIZE || '104857600'),
    adminEmail: env.ADMIN_EMAIL,
    bcryptRounds: parseInt(env.BCRYPT_ROUNDS || '12'),
    sessionExpireHours: parseInt(env.SESSION_EXPIRE_HOURS || '24')
  };

  // 验证必需的环境变量
  const requiredVars = [
    { key: 'jwtSecret', name: 'JWT_SECRET' },
    { key: 'r2PublicDomain', name: 'R2_PUBLIC_DOMAIN' }
  ];

  for (const { key, name } of requiredVars) {
    if (!config[key as keyof typeof config]) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  return config;
}

export function validateEnv(env: Env): string[] {
  const errors: string[] = [];
  
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }
  
  if (!env.R2_PUBLIC_DOMAIN || !env.R2_PUBLIC_DOMAIN.startsWith('https://')) {
    errors.push('R2_PUBLIC_DOMAIN must be a valid HTTPS URL');
  }
  
  if (env.DEFAULT_STORAGE_QUOTA) {
    const quota = parseInt(env.DEFAULT_STORAGE_QUOTA);
    if (isNaN(quota) || quota <= 0) {
      errors.push('DEFAULT_STORAGE_QUOTA must be a positive number');
    }
  }
  
  return errors;
}