<template>
  <div class="log-view">
    <div class="log-header">
      <div class="section-title">操作日志</div>
      <el-button size="small" @click="handleClear">清空日志</el-button>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-checkbox v-model="allChecked" @change="handleAllChange">全部</el-checkbox>
      <el-checkbox v-model="filters.farm">农场</el-checkbox>
      <el-checkbox v-model="filters.friend">好友</el-checkbox>
      <el-checkbox v-model="filters.task">任务</el-checkbox>
      <el-checkbox v-model="filters.shop">商店</el-checkbox>
      <el-checkbox v-model="filters.system">系统</el-checkbox>
    </div>

    <!-- 日志列表 -->
    <div class="log-list" ref="logListRef" @scroll="handleScroll">
      <div v-for="(log, i) in displayLogs" :key="i" class="log-line" :class="log.level">
        <span class="log-time">{{ log.time }}</span>
        <span class="log-msg">{{ log.message }}</span>
      </div>
      <div v-if="displayLogs.length === 0" class="log-empty">暂无日志</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { useLog } from '@/composables/useLog'

const { logs, loadLogs, clearLogs } = useLog()

const logListRef = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

const filters = reactive({
  farm: true,
  friend: true,
  task: true,
  shop: true,
  system: true,
})

const allChecked = computed({
  get: () => Object.values(filters).every(Boolean),
  set: () => {},
})

const displayLogs = computed(() => {
  const allOn = Object.values(filters).every(Boolean)
  if (allOn) return logs
  return logs.filter(l => filters[l.category as keyof typeof filters])
})

function handleAllChange(val: boolean) {
  const v = val as boolean
  filters.farm = v
  filters.friend = v
  filters.task = v
  filters.shop = v
  filters.system = v
}

async function handleClear() {
  await clearLogs()
}

function handleScroll() {
  const el = logListRef.value
  if (!el) return
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30
  autoScroll.value = atBottom
}

function scrollToBottom() {
  if (!autoScroll.value) return
  const el = logListRef.value
  if (el) {
    nextTick(() => { el.scrollTop = el.scrollHeight })
  }
}

watch(() => logs.length, scrollToBottom)

onMounted(() => {
  loadLogs()
  nextTick(scrollToBottom)
})
</script>

<style scoped>
.log-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  --el-checkbox-text-color: var(--color-text);
}

.log-list {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: 8px;
  padding: 8px 12px;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  min-height: 0;
}

.log-line {
  padding: 2px 0;
  display: flex;
  gap: 8px;
}

.log-line.warn {
  color: var(--color-warning);
}

.log-time {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.log-empty {
  color: var(--color-text-secondary);
  text-align: center;
  padding: 20px;
}
</style>
