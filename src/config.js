// ─────────────────────────────────────────────────────────────────────────────
// MaiaOS — Configuração central
// ─────────────────────────────────────────────────────────────────────────────

// 1. Acesse: https://dev.twitch.tv/console/apps
// 2. OAuth Redirect URLs: http://localhost:5173
// 3. Cole o Client ID abaixo:
export const TWITCH_CLIENT_ID   = '679c8ajbzcflbqazlku4ugqkn38dch'
export const TWITCH_REDIRECT_URI = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:5173'

// URL do backend MaiaOS API
// Dev:        http://localhost:3001
// Produção:   https://sua-api.railway.app
export const API_URL = 'http://localhost:3001'
export const TWITCH_CHANNEL = 'maxterlabs'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'