<template>
  <OsWindow id="cmd" icon="⌨️" title="Terminal — MaiaOS">
    <div class="terminal" ref="terminalEl" @click="focusInput">

      <div v-if="!store.user" class="terminal-line">
        Faça login para acessar o terminal.
      </div>

      <template v-else>
        <div
          v-for="(line, i) in lines"
          :key="i"
          class="terminal-line"
          :class="{
            'terminal-line--error': line.error,
            'terminal-line--blank': line.blank
          }"
        >{{ line.text }}</div>

        <div class="terminal-line terminal-input-row" v-if="!initializing">
          <span class="terminal-prompt">{{ currentPrompt }}</span>
          <input
            ref="inputEl"
            v-model="inputVal"
            class="terminal-input"
            :disabled="busy"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            @keydown="onKeydown"
          />
        </div>
      </template>

    </div>
  </OsWindow>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import OsWindow            from './OsWindow.vue'
import { useDesktopStore } from '@/stores/desktop'
import { API_URL, TWITCH_CHANNEL } from '@/config'

const store        = useDesktopStore()
const terminalEl   = ref(null)
const inputEl      = ref(null)
const lines        = ref([])
const inputVal     = ref('')
const busy         = ref(false)
const initializing = ref(false)
const userLevel    = ref('user')
const userBalance  = ref(0)

// ── Nick e prompt ─────────────────────────────────────────────────────────────
const isRoot = computed(() =>
  store.user?.login?.toLowerCase() === TWITCH_CHANNEL.toLowerCase()
)

const nick = computed(() =>
  (store.user?.login ?? 'guest').slice(0, 9).toLowerCase()
)

const currentPath = computed(() => {
  if (isRoot.value)              return 'C:\\MaiaOS\\root'
  if (userLevel.value === 'sub') return `C:\\MaiaOS\\subs\\${nick.value}`
  return `C:\\MaiaOS\\viewers\\${nick.value}`
})

const currentPrompt = computed(() => `PS ${currentPath.value}>`)

// ── Frases diárias ────────────────────────────────────────────────────────────
const DAILY_PHRASES = [
  'Nenhum tokoin foi desperdiçado na produção deste terminal.',
  'Este software é fornecido sem garantia de sanidade mental.',
  'Bugs são features aguardando documentação.',
  'Em caso de incêndio: git commit, git push, sair correndo.',
  'Otimizado para rodar a 60fps no coração dos viewers.',
  'Testado em produção desde o primeiro dia.',
  'Se você leu isso, já sabe demais.',
  'Powered by café e streams de madrugada.',
  'Nenhum dado foi perdido. Provavelmente.',
  'Última atualização: quando deu.',
  'Compatível com a maioria das realidades.',
  'Nenhuma IA foi prejudicada na criação deste sistema.',
]

function getDailyPhrase() {
  const now   = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const day   = Math.floor((now - start) / 86400000)
  return DAILY_PHRASES[day % DAILY_PHRASES.length]
}

// ── Saudação da Maia por visitas ──────────────────────────────────────────────
function getMaiaGreeting(visits) {
  if (isRoot.value) return 'Acesso root confirmado. Tentei te bloquear uma vez. Não funcionou.'
  if (visits <= 1)  return "Novo por aqui? Digite 'help' e eu te mostro o que rola."
  if (visits <= 3)  return `Oi de novo, ${nick.value}. O 'help' ainda funciona, se precisar refrescar.`
  if (visits <= 9)  return "Já sei que você sabe o que faz. O 'help' tá aqui se mudar de ideia."
  if (visits <= 24) return `Visita número ${visits}. Você praticamente mora aqui, ${nick.value}.`
  return 'Ei. De novo. Como sempre. Obrigada pela fidelidade, acho.'
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function addLine(text = '', error = false) {
  lines.value.push({ text, error, blank: false })
  scrollBottom()
}

function addBlank() {
  lines.value.push({ text: '', error: false, blank: true })
}

async function scrollBottom() {
  await nextTick()
  if (terminalEl.value)
    terminalEl.value.scrollTop = terminalEl.value.scrollHeight
}

function focusInput() {
  inputEl.value?.focus()
}

// ── Dados do usuário ──────────────────────────────────────────────────────────
async function fetchUserData() {
  if (!store.user?.id) return null
  try {
    const res  = await fetch(`${API_URL}/api/user/${store.user.id}`)
    const data = await res.json()
    userBalance.value = data.tokoins?.balance ?? 0
    if (isRoot.value)           userLevel.value = 'root'
    else if (data.isSubscriber) userLevel.value = 'sub'
    else                        userLevel.value = 'user'
    return data
  } catch {
    return null
  }
}

async function registerVisit() {
  if (!store.user?.id) return 1
  try {
    const res  = await fetch(`${API_URL}/api/cmd/visit`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ twitchId: store.user.id }),
    })
    const data = await res.json()
    return data.visits ?? 1
  } catch {
    return 1
  }
}

// ── Boot do terminal ──────────────────────────────────────────────────────────
async function initTerminal() {
  if (!store.user) return
  initializing.value = true
  lines.value = []

  const [, visits] = await Promise.all([fetchUserData(), registerVisit()])
  initializing.value = false

  addLine('MaiaOS Terminal [Versão 1.0.0]')
  addLine(`MaiaOS © MaxterLabs — ${getDailyPhrase()}`)
  addBlank()
  addLine(getMaiaGreeting(visits))
  addBlank()

  await nextTick()
  focusInput()
}

// ── Histórico de comandos ─────────────────────────────────────────────────────
const history    = ref([])
const historyIdx = ref(-1)
const savedInput = ref('')

function historyUp() {
  if (!history.value.length) return
  if (historyIdx.value === -1) savedInput.value = inputVal.value
  historyIdx.value = Math.min(historyIdx.value + 1, history.value.length - 1)
  inputVal.value = history.value[history.value.length - 1 - historyIdx.value]
}

function historyDown() {
  if (historyIdx.value === -1) return
  historyIdx.value--
  inputVal.value = historyIdx.value === -1
    ? savedInput.value
    : history.value[history.value.length - 1 - historyIdx.value]
}

// ── Keydown ───────────────────────────────────────────────────────────────────
function onKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    const raw = inputVal.value.trim()
    if (!raw) {
      addLine(currentPrompt.value)
      return
    }
    history.value.push(raw)
    historyIdx.value = -1
    addLine(`${currentPrompt.value} ${raw}`)
    inputVal.value = ''
    executeCommand(raw)
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    historyUp()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    historyDown()
    return
  }

  if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault()
    lines.value = []
  }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
async function executeCommand(raw) {
  const parts = raw.trim().split(/\s+/)
  const cmd   = parts[0].toLowerCase()
  const args  = parts.slice(1)

  switch (cmd) {
    case 'help':
      cmdHelp()
      break

    case 'clear':
    case 'cls':
      lines.value = []
      break

    case 'whoami':
      await cmdWhoami()
      break

    case 'balance':
      await cmdBalance()
      break

    case 'redeem':
      await cmdRedeem(args)
      break

    case 'open':
      cmdOpen(args)
      break

    case 'ls':
      cmdLs()
      break

    case 'setcode':
      await cmdSetcode(args)
      break

    case 'revoke':
      await cmdRevoke(args)
      break

    case 'echo':
      addLine(args.join(' '))
      break

    case 'sudo':
      addLine('Acesso negado.', true)
      break

    case 'maia':
      addBlank()
      addLine('Oi! Sou a Maia, IA co-host do canal MaxterLabs.')
      addLine('Cuido do chat, dos Tokoins e de boa parte do MaiaOS.')
      addLine("Se precisar de ajuda, 'help' resolve quase tudo. Quase.")
      addBlank()
      break

    default:
      addLine(`O termo '${cmd}' não é reconhecido. Tente 'help'.`, true)
  }
}

// ── Comandos ──────────────────────────────────────────────────────────────────
function cmdHelp() {
  addBlank()
  addLine('  help                     Lista os comandos disponíveis.')
  addLine('  clear                    Limpa o terminal. (cls também funciona)')
  addLine('  whoami                   Exibe seu perfil.')
  addLine('  balance                  Seu saldo de Tokoins.')
  addLine('  redeem <CÓDIGO>          Resgata um código de Tokoins.')
  addLine('  open <app>               Abre uma janela do MaiaOS.')
  addLine('  ls                       Lista os programas disponíveis.')

  if (isRoot.value) {
    addBlank()
    addLine('  setcode <CÓD> <val> [usos] [min]')
    addLine('                           Cria um código de redeem.')
    addLine('  revoke <CÓDIGO>          Desativa um código ativo.')
  }

  addBlank()
}

async function cmdWhoami() {
  busy.value = true
  await fetchUserData()
  busy.value = false

  const levelLabel = isRoot.value
    ? 'root'
    : userLevel.value === 'sub'
      ? 'subscriber'
      : 'user'

  addBlank()
  addLine(`Usuário   : ${store.user?.displayName ?? store.user?.login}`)
  addLine(`ID        : ${store.user?.id}`)
  addLine(`Nível     : ${levelLabel}`)
  addLine(`Tokoins   : ${userBalance.value}`)
  addBlank()
}

async function cmdBalance() {
  busy.value = true
  await fetchUserData()
  busy.value = false
  addLine(`Tokoins   : ${userBalance.value}`)
}

async function cmdRedeem(args) {
  const code = args[0]
  if (!code) {
    addLine('Uso: redeem <CÓDIGO>', true)
    return
  }

  busy.value = true
  try {
    const res  = await fetch(`${API_URL}/api/cmd/redeem`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ twitchId: store.user.id, code }),
    })

    const data = await res.json()

    if (!res.ok) {
      addLine(`Erro: ${data.error}`, true)
    } else {
      const bonus = data.isSub ? '  (bônus sub ×1.5 aplicado)' : ''
      addLine('Código resgatado.')
      addLine(`+ ${data.earned} Tokoins${bonus}  |  Saldo atual: ${data.newBalance}`)
      userBalance.value = data.newBalance
    }
  } catch {
    addLine('Erro: falha de conexão.', true)
  } finally {
    busy.value = false
  }
}

function cmdOpen(args) {
  const APP_MAP = {
    jogos:   'jogos',
    jogo:    'jogos',
    loja:    'loja',
    ranking: 'ranking',
    perfil:  'perfil',
    chat:    'chat',
    maia:    'maia',
  }

  const target = APP_MAP[args[0]?.toLowerCase()]

  if (!target) {
    addLine(`App não encontrado: '${args[0] ?? ''}'.`, true)
    addLine(`Disponíveis: ${[...new Set(Object.values(APP_MAP))].join(', ')}`)
    return
  }

  store.openWindow(target)
  addLine(`Abrindo ${target}...`)
}

function cmdLs() {
  addBlank()
  addLine('    Diretório: C:\\MaiaOS\\apps')
  addBlank()
  addLine('Modo    Nome')
  addLine('----    ----')
  addLine('d----   jogos')
  addLine('d----   loja')
  addLine('d----   ranking')
  addLine('-a---   flip.exe')
  addBlank()
}

async function cmdSetcode(args) {
  if (!isRoot.value) {
    addLine('Acesso negado.', true)
    return
  }

  const [code, valueStr, maxUsesStr, expiresInStr] = args

  if (!code || !valueStr) {
    addLine('Uso: setcode <CÓDIGO> <valor> [usos=1] [minutos=∞]', true)
    addLine('Ex.: setcode LIVE100 500 10 30')
    return
  }

  const value     = parseInt(valueStr)
  const maxUses   = maxUsesStr   ? parseInt(maxUsesStr)   : 1
  const expiresIn = expiresInStr ? parseInt(expiresInStr) : null

  if (isNaN(value) || value < 1) {
    addLine('Valor inválido.', true)
    return
  }

  busy.value = true
  try {
    const res  = await fetch(`${API_URL}/api/cmd/setcode`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ twitchId: store.user.id, code, value, maxUses, expiresIn }),
    })

    const data = await res.json()

    if (!res.ok) {
      addLine(`Erro: ${data.error}`, true)
    } else {
      const action = data.action === 'updated' ? 'atualizado' : 'criado'
      const expMsg = expiresIn ? `  |  Expira em: ${expiresIn}min` : ''
      addLine(`Código ${code.toUpperCase()} ${action}.`)
      addLine(`Valor: ${value} Tokoins  |  Usos: ${maxUses}${expMsg}`)
    }
  } catch {
    addLine('Erro: falha de conexão.', true)
  } finally {
    busy.value = false
  }
}

async function cmdRevoke(args) {
  if (!isRoot.value) {
    addLine('Acesso negado.', true)
    return
  }

  const code = args[0]
  if (!code) {
    addLine('Uso: revoke <CÓDIGO>', true)
    return
  }

  busy.value = true
  try {
    const res  = await fetch(`${API_URL}/api/cmd/revoke`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ twitchId: store.user.id, code }),
    })

    const data = await res.json()

    if (!res.ok) addLine(`Erro: ${data.error}`, true)
    else addLine(`Código ${code.toUpperCase()} desativado.`)
  } catch {
    addLine('Erro: falha de conexão.', true)
  } finally {
    busy.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  if (store.user) initTerminal()
})

watch(() => store.user, (u) => {
  if (u) initTerminal()
  else lines.value = []
})

watch(() => store.windows.cmd?.open, (open) => {
  if (open && store.user && lines.value.length === 0) initTerminal()
  if (open) nextTick(() => focusInput())
})
</script>

<style scoped>
:deep(.win-body) {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.terminal {
  flex: 1;
  background: #0c0c0c;
  color: #cccccc;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 12px 6px;
  overflow-y: auto;
  cursor: text;
  min-height: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal::-webkit-scrollbar {
  width: 4px;
}

.terminal::-webkit-scrollbar-track {
  background: transparent;
}

.terminal::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
}

.terminal-line {
  display: block;
  min-height: 1.5em;
}

.terminal-line--blank {
  min-height: 0.75em;
}

.terminal-line--error {
  color: #f44747;
}

.terminal-input-row {
  display: flex;
  align-items: center;
}

.terminal-prompt {
  flex-shrink: 0;
  white-space: nowrap;
  margin-right: 4px;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #cccccc;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  padding: 0;
  min-width: 0;
  caret-color: #cccccc;
}

.terminal-input:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>