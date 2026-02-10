<template>
  <div class="app-container">
    <!-- 启动画面 -->
    <div v-if="showSplash" class="splash-screen">
      <div class="splash-content">
        <h1>QQ经典农场助手</h1>
        <div class="splash-warnings">
          <p class="splash-warning">⚠️ 本项目完全开源免费</p>
          <p class="splash-warning">如果你是付费购买的，说明你被骗了！</p>
          <p class="splash-warning">请立即申请退款并举报卖家！</p>
        </div>
        <div class="splash-divider"></div>
        <a class="splash-link" @click="openGithub">
          🔗 GitHub: github.com/QianChenJun/qq-farm-bot
        </a>
        <div class="splash-divider"></div>
        <button class="splash-button" @click="closeSplash">
          我已知晓，继续使用
        </button>
      </div>
    </div>

    <!-- 自定义标题栏 -->
    <div class="titlebar">
      <span class="titlebar-title">
        QQ经典农场助手 - 开源免费项目 |
        <a class="titlebar-link" @click="openGithub">github.com/QianChenJun/qq-farm-bot</a>
      </span>
      <div class="titlebar-buttons">
        <button class="titlebar-btn" @click="minimize">─</button>
        <button class="titlebar-btn close" @click="close">✕</button>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="main-layout">
      <!-- 左侧导航 -->
      <div class="sidebar">
        <div class="nav-items">
          <div
            v-for="item in navItems"
            :key="item.path"
            class="nav-item"
            :class="{ active: route.path === item.path }"
            @click="router.push(item.path)"
            :title="item.label"
          >
            <span class="nav-icon">{{ item.icon }}</span>
          </div>
        </div>
        <div class="sidebar-bottom">
          <div class="status-dot" :class="statusClass" :title="statusText"></div>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="content">
        <router-view />

        <!-- 全局水印 -->
        <div class="watermark">
          <a class="watermark-link" @click="openGithub">
            开源免费 | github.com/QianChenJun/qq-farm-bot | 付费购买请退款
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const connected = ref(false)
const showSplash = ref(true)

const navItems = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/logs', icon: '📋', label: '日志' },
  { path: '/settings', icon: '⚙', label: '设置' },
]

const statusClass = computed(() => (connected.value ? 'online' : 'offline'))
const statusText = computed(() => (connected.value ? '在线' : '离线'))

function minimize() {
  window.electronAPI?.invoke('window:minimize')
}

function close() {
  window.electronAPI?.invoke('window:close')
}

function openGithub() {
  window.electronAPI?.invoke('shell:openExternal', 'https://github.com/QianChenJun/qq-farm-bot')
}

function closeSplash() {
  showSplash.value = false
}

function openSplash() {
  showSplash.value = true
}

// 提供给子组件使用
provide('openSplash', openSplash)

// 监听状态更新
if (window.electronAPI) {
  window.electronAPI.on('bot:status-update', (data: any) => {
    if (data && typeof data.connected === 'boolean') {
      connected.value = data.connected
    }
  })
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 72px;
  background-color: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  flex-shrink: 0;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin: 0 auto;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.nav-item.active {
  background: var(--color-accent);
}

.nav-icon {
  font-size: 20px;
}

.sidebar-bottom {
  padding: 16px 0;
  display: flex;
  justify-content: center;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: background 0.3s;
}

.status-dot.online {
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.status-dot.offline {
  background: var(--color-danger);
  box-shadow: 0 0 6px var(--color-danger);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  position: relative;
}

.titlebar-title {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.titlebar-link {
  color: var(--color-accent);
  cursor: pointer;
  transition: opacity 0.2s;
}

.titlebar-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* 启动画面 */
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s;
}

.splash-content {
  text-align: center;
  padding: 40px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 2px solid var(--color-accent);
}

.splash-content h1 {
  font-size: 28px;
  margin-bottom: 24px;
  color: var(--color-accent);
}

.splash-warnings {
  margin-bottom: 16px;
}

.splash-warning {
  font-size: 18px;
  color: #ff6b6b;
  margin: 12px 0;
  font-weight: bold;
}

.splash-divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 20px 0;
}

.splash-link {
  display: inline-block;
  margin: 0;
  padding: 12px 24px;
  background: var(--color-accent);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: opacity 0.2s;
}

.splash-link:hover {
  opacity: 0.8;
}

.splash-button {
  margin: 0;
  padding: 12px 32px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.splash-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

/* 全局水印 */
.watermark {
  position: fixed;
  bottom: 8px;
  right: 16px;
  z-index: 1000;
  pointer-events: auto;
}

.watermark-link {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.watermark-link:hover {
  background: rgba(0, 0, 0, 0.8);
  color: rgba(255, 255, 255, 0.9);
  border-color: var(--color-accent);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
