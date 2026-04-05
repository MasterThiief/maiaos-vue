<template>
  <div class="start-menu" :class="{ visible: store.startMenuOpen }">

    <!-- Header: logado vs não logado -->
    <div class="sm-header">
      <template v-if="store.user">
        <div class="sm-user-avatar">
          <img
            v-if="store.user.profileImage"
            :src="store.user.profileImage"
            :alt="store.user.displayName"
            style="width:40px;height:40px;border-radius:50%;object-fit:cover"
          />
          <span v-else style="font-size:20px">🎮</span>
        </div>
        <div class="sm-user-info">
          <div class="sm-name">{{ store.user.displayName }}</div>
          <div class="sm-sub">⚡ Tokoins • Online</div>
        </div>
      </template>

      <template v-else>
        <div class="sm-user-avatar" style="font-size:20px">👤</div>
        <div class="sm-user-info" style="flex:1">
          <div class="sm-name" style="font-size:11px;font-weight:400;color:rgba(255,255,255,0.7)">Não conectado</div>
          <button class="twitch-login-btn" @click="doLogin">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            Entrar com Twitch
          </button>
        </div>
      </template>
    </div>

    <div class="sm-cols">
      <div class="sm-col sm-col-left">
        <div class="sm-item" v-for="item in leftItems" :key="item.id" @click="open(item.id)">
          <i :class="item.icon"></i>{{ item.label }}
        </div>
        <div class="sm-sep"></div>
        <div class="sm-item" @click="open('loja')"><i class="ph ph-storefront"></i>Loja</div>
        <div class="sm-item" @click="open('rifa')"><i class="ph ph-ticket"></i>Rifas</div>
      </div>
      <div class="sm-col sm-col-right">
        <div class="sm-item" @click="open('perfil')"><i class="ph ph-user"></i>Meu Perfil</div>
        <div class="sm-item" @click="open('ranking')"><i class="ph ph-trophy"></i>Ranking</div>
        <div class="sm-sep"></div>
        <div class="sm-item" @click="notify('⚙️','Configurações em breve!')"><i class="ph ph-gear"></i>Configurações</div>
        <div class="sm-item" @click="notify('❓','Ajuda em breve!')"><i class="ph ph-question"></i>Ajuda</div>
      </div>
    </div>

    <div class="sm-footer">
      <button v-if="store.user" class="sm-foot-btn" @click="doLogout">
        <i class="ph ph-sign-out"></i> Sair
      </button>
      <button class="sm-foot-btn" @click="notify('🔄','Reiniciando...')">
        <i class="ph ph-power"></i> Desligar
      </button>
    </div>
  </div>
</template>

<script setup>
import { useDesktopStore } from '@/stores/desktop'
import { useTwitchAuth }   from '@/composables/useTwitchAuth'

const store = useDesktopStore()
const { login, logout } = useTwitchAuth()

const leftItems = [
  { id: 'maia',   icon: 'ph ph-robot',          label: 'Maia' },
  { id: 'emojis', icon: 'ph ph-smiley',          label: 'Emojis & Efeitos' },
  { id: 'jogos',  icon: 'ph ph-game-controller', label: 'Jogos' },
]

function open(id)        { store.openWindow(id); store.closeStartMenu() }
function notify(i, m)    { store.closeStartMenu(); store.showToast(i, m) }
function doLogin()       { store.closeStartMenu(); login() }
function doLogout()      { store.closeStartMenu(); logout() }
</script>
