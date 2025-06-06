#!/bin/bash

# CF Image Hosting Setup Script
# This script helps set up the Cloudflare infrastructure for the image hosting system

set -e

echo "🚀 CF Image Hosting Setup Script"
echo "================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

echo "✅ Wrangler CLI found"

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare:"
    wrangler login
fi

echo "✅ Cloudflare authentication verified"

# Create KV namespaces
echo "📦 Creating KV namespaces..."

echo "Creating USERS_KV namespace..."
USERS_KV_ID=$(wrangler kv:namespace create "USERS_KV" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
USERS_KV_PREVIEW_ID=$(wrangler kv:namespace create "USERS_KV" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating FILES_KV namespace..."
FILES_KV_ID=$(wrangler kv:namespace create "FILES_KV" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
FILES_KV_PREVIEW_ID=$(wrangler kv:namespace create "FILES_KV" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating INVITATIONS_KV namespace..."
INVITATIONS_KV_ID=$(wrangler kv:namespace create "INVITATIONS_KV" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
INVITATIONS_KV_PREVIEW_ID=$(wrangler kv:namespace create "INVITATIONS_KV" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating SESSIONS_KV namespace..."
SESSIONS_KV_ID=$(wrangler kv:namespace create "SESSIONS_KV" --preview false | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
SESSIONS_KV_PREVIEW_ID=$(wrangler kv:namespace create "SESSIONS_KV" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "✅ KV namespaces created"

# Create R2 bucket
echo "🪣 Creating R2 bucket..."
wrangler r2 bucket create cf-image-hosting-files

echo "✅ R2 bucket created"

# Update wrangler.toml with actual IDs
echo "📝 Updating wrangler.toml with namespace IDs..."

cat > wrangler.toml << EOF
name = "cf-image-hosting-worker"
main = "workers/src/index.ts"
compatibility_date = "2023-11-01"

[env.production]
name = "cf-image-hosting-worker"

[env.development]
name = "cf-image-hosting-worker-dev"

# KV Namespaces
[[kv_namespaces]]
binding = "USERS_KV"
id = "$USERS_KV_ID"
preview_id = "$USERS_KV_PREVIEW_ID"

[[kv_namespaces]]
binding = "FILES_KV"
id = "$FILES_KV_ID"
preview_id = "$FILES_KV_PREVIEW_ID"

[[kv_namespaces]]
binding = "INVITATIONS_KV"
id = "$INVITATIONS_KV_ID"
preview_id = "$INVITATIONS_KV_PREVIEW_ID"

[[kv_namespaces]]
binding = "SESSIONS_KV"
id = "$SESSIONS_KV_ID"
preview_id = "$SESSIONS_KV_PREVIEW_ID"

# R2 Buckets
[[r2_buckets]]
binding = "FILES_BUCKET"
bucket_name = "cf-image-hosting-files"

# Environment Variables
[vars]
ADMIN_EMAIL = "admin@example.com"
CORS_ORIGIN = "http://localhost:3000"
EOF

echo "✅ wrangler.toml updated"

# Set secrets
echo "🔐 Setting up secrets..."
echo "Please enter a strong JWT secret (or press Enter to generate one):"
read -s JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT secret: $JWT_SECRET"
fi

echo "$JWT_SECRET" | wrangler secret put JWT_SECRET

echo "✅ Secrets configured"

# Create initial admin invitation
echo "👤 Creating initial admin invitation code..."
ADMIN_INVITATION=$(openssl rand -hex 4 | tr '[:lower:]' '[:upper:]')
echo "Initial admin invitation code: $ADMIN_INVITATION"

# Store the invitation in KV (this would normally be done through the API)
echo "Please save this invitation code to register the first admin user."

echo ""
echo "🎉 Setup complete!"
echo "==================="
echo ""
echo "Next steps:"
echo "1. Update CORS_ORIGIN in wrangler.toml with your production domain"
echo "2. Update ADMIN_EMAIL in wrangler.toml with your admin email"
echo "3. Deploy the worker: npm run worker:deploy"
echo "4. Build and deploy the frontend to your hosting service"
echo "5. Use the invitation code '$ADMIN_INVITATION' to register the first admin user"
echo ""
echo "Development:"
echo "- Start frontend: npm run dev"
echo "- Start worker: npm run worker:dev"
echo ""
echo "Happy hosting! 🚀"
EOF
