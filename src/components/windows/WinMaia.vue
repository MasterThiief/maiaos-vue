<template>
  <OsWindow id="maia" icon="🤖" title="Maia — Assistente da Live">
    <template #toolbar>
      <button class="win-toolbar-btn">Arquivo</button>
      <button class="win-toolbar-btn">Editar</button>
      <button class="win-toolbar-btn">Ajuda</button>
    </template>
    <div class="maia-hero">
      <div class="m-avatar">🤖</div>
      <h2>Maia</h2>
      <p>IA co-host da live. Responde perguntas, interage com o chat e mantém a live animada 24/7.</p>
      <div style="margin-top:10px;font-size:11px;color:#aaa">
        <span class="status-dot"></span> Online agora
      </div>
    </div>
    <ul class="maia-feats">
      <li><div class="fi">💬</div><div><strong style="color:#fff">Interação com Chat</strong><br>Responde menções, comanda efeitos e gerencia Tokoins em tempo real.</div></li>
      <li><div class="fi">🎙️</div><div><strong style="color:#fff">Voz Sintética</strong><br>Fala com a voz da Maia via TTS — avisos, boas-vindas e reações.</div></li>
      <li><div class="fi">⚡</div><div><strong style="color:#fff">Economia Tokoins</strong><br>Distribui, valida e controla toda a economia virtual da live.</div></li>
      <li><div class="fi">🏆</div><div><strong style="color:#fff">Horóscopo & Rankings</strong><br>Gera horóscopo diário e atualiza o ranking de viewers automaticamente.</div></li>
    </ul>
  </OsWindow>
</template>
<script setup>
import OsWindow from './OsWindow.vue'
</script>
