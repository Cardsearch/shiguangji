/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TCB_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
