/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MAP_API_URL?: string
  readonly VITE_GENAI_MODE?: string
  readonly VITE_GENAI_API_URL?: string
  readonly VITE_SHOW_DEMO_OWNER?: string
  readonly VITE_OSM_TILE_URL?: string
  readonly VITE_MAP_DEFAULT_LAT?: string
  readonly VITE_MAP_DEFAULT_LNG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
