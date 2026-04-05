// ─────────────────────────────────────────────────────────────────────────────
// MaiaOS — Configuração central
// ─────────────────────────────────────────────────────────────────────────────

export const TWITCH_CLIENT_ID    = import.meta.env.VITE_TWITCH_CLIENT_ID   || '679c8ajbzcflbqazlku4ugqkn38dch'
export const TWITCH_REDIRECT_URI = import.meta.env.VITE_TWITCH_REDIRECT_URI || (
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
)

export const API_URL        = import.meta.env.VITE_API_URL    || 'http://localhost:3001'
export const SOCKET_URL     = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
export const TWITCH_CHANNEL = 'maxterlabs'