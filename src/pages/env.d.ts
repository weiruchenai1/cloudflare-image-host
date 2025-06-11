/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_R2_DOMAIN: string
  readonly VITE_CLOUDFLARE_ACCOUNT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
