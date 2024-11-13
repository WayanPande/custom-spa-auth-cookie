interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_API_URL: string;
  readonly VITE_COOKIE_NAME: string;
  readonly VITE_AUTH_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
