/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AUDIO_SRC?: string;
  readonly VITE_AUDIO_TITLE?: string;
  readonly VITE_SPOTIFY_TRACK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
