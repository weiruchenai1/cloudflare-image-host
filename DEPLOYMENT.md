# CF Image Hosting - Deployment Guide

This guide will help you deploy the CF Image Hosting system to production.

## Prerequisites

- Node.js 18+ installed
- Cloudflare account with Workers and R2 access
- Wrangler CLI installed globally: `npm install -g wrangler`

## 1. Cloudflare Setup

### Login to Cloudflare
```bash
wrangler login
```

### Create KV Namespaces
```bash
# Create production namespaces
wrangler kv:namespace create "USERS_KV"
wrangler kv:namespace create "FILES_KV"
wrangler kv:namespace create "INVITATIONS_KV"
wrangler kv:namespace create "SESSIONS_KV"

# Create preview namespaces for development
wrangler kv:namespace create "USERS_KV" --preview
wrangler kv:namespace create "FILES_KV" --preview
wrangler kv:namespace create "INVITATIONS_KV" --preview
wrangler kv:namespace create "SESSIONS_KV" --preview
```

### Create R2 Bucket
```bash
wrangler r2 bucket create cf-image-hosting-files
```

### Update wrangler.toml
Replace the placeholder IDs in `wrangler.toml` with the actual namespace IDs from the previous steps.

### Set Secrets
```bash
# Generate and set JWT secret
wrangler secret put JWT_SECRET

# Set admin email
wrangler secret put ADMIN_EMAIL
```

## 2. Environment Configuration

### Frontend Environment
Create `.env.production`:
```env
VITE_API_URL=https://your-worker-domain.workers.dev
```

### Backend Environment
Update `wrangler.toml`:
```toml
[vars]
ADMIN_EMAIL = "your-admin@example.com"
CORS_ORIGIN = "https://your-frontend-domain.com"
```

## 3. Build and Deploy

### Deploy Backend (Cloudflare Worker)
```bash
# Build the worker
npm run worker:build

# Deploy to production
npm run worker:deploy
```

### Build Frontend
```bash
# Build for production
npm run build
```

The built files will be in the `dist` directory. Deploy these to your preferred hosting service:

#### Option 1: Cloudflare Pages
```bash
# Install Wrangler Pages plugin
npm install -g @cloudflare/wrangler

# Deploy to Cloudflare Pages
wrangler pages publish dist --project-name cf-image-hosting
```

#### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option 3: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## 4. Initial Setup

### Create Admin User
1. Visit your deployed frontend
2. Go to the registration page
3. Use the initial invitation code (you'll need to create this manually in the KV store)
4. Register as the first admin user

### Create Initial Invitation Code
You can create an initial invitation code by adding it directly to the INVITATIONS_KV namespace:

```bash
# Create an invitation code entry
wrangler kv:key put --binding=INVITATIONS_KV "invitation:ADMIN001" '{
  "id": "admin-001",
  "code": "ADMIN001",
  "createdBy": "system",
  "createdAt": "2024-01-01T00:00:00Z",
  "maxUses": 1,
  "currentUses": 0,
  "isActive": true,
  "usedBy": []
}'
```

## 5. Domain Configuration

### Custom Domain for Worker
1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your worker
3. Go to Settings > Triggers
4. Add a custom domain

### Custom Domain for Frontend
Configure your hosting service to use your custom domain.

## 6. Security Considerations

### CORS Configuration
Update the `CORS_ORIGIN` environment variable to match your frontend domain.

### JWT Secret
Use a strong, randomly generated JWT secret:
```bash
# Generate a secure secret
openssl rand -base64 32
```

### Rate Limiting
The system includes built-in rate limiting. Monitor and adjust limits as needed.

## 7. Monitoring and Maintenance

### Cloudflare Analytics
Monitor your worker's performance in the Cloudflare Dashboard.

### Storage Monitoring
Keep track of R2 storage usage and costs.

### KV Usage
Monitor KV read/write operations and optimize as needed.

## 8. Backup and Recovery

### KV Backup
Regularly backup your KV data:
```bash
# List all keys in a namespace
wrangler kv:key list --binding=USERS_KV

# Backup specific keys
wrangler kv:key get --binding=USERS_KV "user:user-id"
```

### R2 Backup
Consider setting up automated backups for your R2 bucket.

## 9. Scaling Considerations

### Performance Optimization
- Enable Cloudflare caching for static assets
- Optimize image delivery with Cloudflare Images (optional)
- Use Cloudflare's global network for CDN

### Cost Optimization
- Monitor R2 storage and bandwidth costs
- Implement file lifecycle policies
- Consider compression for large files

## 10. Troubleshooting

### Common Issues

#### CORS Errors
- Verify `CORS_ORIGIN` is set correctly
- Check that the frontend domain matches the CORS configuration

#### Authentication Issues
- Verify JWT secret is set correctly
- Check token expiration settings

#### File Upload Issues
- Verify R2 bucket permissions
- Check file size limits
- Monitor worker execution time limits

### Logs and Debugging
```bash
# View worker logs
wrangler tail

# View specific deployment logs
wrangler tail --format=pretty
```

## 11. Updates and Maintenance

### Updating the System
1. Pull latest changes
2. Update dependencies: `npm update`
3. Test locally
4. Deploy backend: `npm run worker:deploy`
5. Build and deploy frontend

### Database Migrations
When updating data structures, ensure backward compatibility or implement migration scripts.

## Support

For issues and questions:
- Check the GitHub repository for known issues
- Review Cloudflare Workers documentation
- Monitor Cloudflare status page for service issues

## Security Updates

Regularly update dependencies and monitor for security vulnerabilities:
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update
```
