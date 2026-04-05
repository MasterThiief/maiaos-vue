import { TWITCH_CLIENT_ID, TWITCH_REDIRECT_URI, API_URL } from '@/config'
import { useDesktopStore } from '@/stores/desktop'

export function useTwitchAuth() {
  const store = useDesktopStore()

  function login() {
    const params = new URLSearchParams({
      client_id:     TWITCH_CLIENT_ID,
      redirect_uri:  TWITCH_REDIRECT_URI,
      response_type: 'token',
      scope:         'user:read:email user:write:chat',
    })
    window.location.href = `https://id.twitch.tv/oauth2/authorize?${params}`
  }

  async function handleCallback() {
    const hash = window.location.hash
    if (!hash) return false

    if (hash.includes('error=')) {
      window.history.replaceState({}, '', window.location.pathname)
      store.showToast('⚠️', 'Acesso negado pela Twitch.')
      return false
    }

    if (!hash.includes('access_token')) return false

    const params = new URLSearchParams(hash.slice(1))
    const token  = params.get('access_token')
    if (!token) return false

    window.history.replaceState({}, '', window.location.pathname)
    store.showToast('🔄', 'Conectando com a Twitch...')

    try {
      // 1. Dados básicos da Twitch
      const res = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id':     TWITCH_CLIENT_ID,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const u    = data.data?.[0]
      if (!u) throw new Error('Usuário não encontrado')

      // 2. Buscar isSubscriber e outros campos no banco próprio
      let isSubscriber = false
      let isVip        = false
      let isMod        = false
      try {
        const profileRes = await fetch(`${API_URL}/api/user/${u.id}`)
        if (profileRes.ok) {
          const profile = await profileRes.json()
          isSubscriber  = profile.isSubscriber ?? false
          isVip         = profile.isVip        ?? false
          isMod         = profile.isMod        ?? false
        }
      } catch {
        // Falha silenciosa: login segue sem status de sub
      }

      const user = {
        id:           u.id,
        login:        u.login,
        displayName:  u.display_name,
        profileImage: u.profile_image_url,
        isSubscriber,
        isVip,
        isMod,
        token,
      }

      store.setUser(user)

      // [NOVO] Persiste sessão no localStorage
      localStorage.setItem('maiaos_user', JSON.stringify(user))

      store.showToast('✅', `Bem-vindo(a), ${u.display_name}!`)
      return true

    } catch (e) {
      console.error('[MaiaOS] Auth error:', e)
      store.showToast('❌', 'Erro ao conectar com a Twitch. Tente novamente.')
      return false
    }
  }

  function logout() {
    localStorage.removeItem('maiaos_user') // [NOVO]
    store.setUser(null)
    store.shutdown()
    store.showToast('👋', 'Sessão encerrada. Até a próxima!')
  }

  return { login, handleCallback, logout }
}