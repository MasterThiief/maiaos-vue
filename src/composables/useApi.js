import { API_URL } from '@/config'

export function useApi() {

  async function getUser(twitchId) {
    const res = await fetch(`${API_URL}/api/user/${twitchId}`)
    if (!res.ok) throw new Error('Usuário não encontrado')
    return res.json()
  }

  async function getUserPerks(twitchId) {
    const res = await fetch(`${API_URL}/api/user/${twitchId}/perks`)
    if (!res.ok) throw new Error('Erro ao buscar perks')
    return res.json()
  }

  async function getUserTransactions(twitchId, limit = 10) {
    const res = await fetch(`${API_URL}/api/user/${twitchId}/transactions?limit=${limit}`)
    if (!res.ok) throw new Error('Erro ao buscar transações')
    return res.json()
  }

  async function getRanking(limit = 10) {
    const res = await fetch(`${API_URL}/api/ranking?limit=${limit}`)
    if (!res.ok) throw new Error('Erro ao buscar ranking')
    return res.json()
  }

  async function getLojaItems() {
    const res = await fetch(`${API_URL}/api/loja/items`)
    if (!res.ok) throw new Error('Erro ao buscar loja')
    return res.json()
  }

  async function comprarItem(twitchId, itemId) {
    const res = await fetch(`${API_URL}/api/loja/comprar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ twitchId, itemId }),
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
  }

  return { getUser, getUserPerks, getUserTransactions, getRanking, getLojaItems, comprarItem }
}
