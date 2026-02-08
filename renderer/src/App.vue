<template>
  <div class="app-container">
    <!-- 自定义标题栏 -->
    <div class="titlebar">
      <span class="titlebar-title">QQ经典农场助手</span>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const connected = ref(false)

const navItems = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/settings', icon: '⚙', label: '设置' },
  { path: '/logs', icon: '📋', label: '日志' },
]

const statusClass = computed(() => (connected.value ? 'online' : 'offline'))
const statusText = computed(() => (connected.value ? '在线' : '离线'))

function minimize() {
  window.electronAPI?.invoke('window:minimize')
}

function close() {
  window.electronAPI?.invoke('window:close')
}

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
}

.titlebar-title {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
