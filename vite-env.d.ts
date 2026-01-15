// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OLLAMA_HOST: string;
  readonly VITE_OLLAMA_MODEL: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
