<template>
  <div class="home-view">
    <!-- 状态卡片区 -->
    <div class="status-cards">
      <div class="card">
        <div class="card-label">昵称</div>
        <div class="card-value">{{ status.connected ? status.name || '--' : '--' }}</div>
      </div>
      <div class="card">
        <div class="card-label">等级</div>
        <div class="card-value">{{ status.connected ? `Lv${status.level}` : '--' }}</div>
      </div>
      <div class="card">
        <div class="card-label">金币</div>
        <div class="card-value gold">{{ status.connected ? status.gold : '--' }}</div>
      </div>
      <div class="card">
        <div class="card-label">经验</div>
        <div class="card-value">{{ expDisplay }}</div>
      </div>
    </div>

    <!-- 登录区 -->
    <div class="section login-section" v-if="!status.connected">
      <div class="login-row">
        <el-input v-model="code" placeholder="请输入 code" class="login-input" />
        <el-button type="primary" :loading="connecting" @click="handleConnect">连接</el-button>
      </div>
      <div class="platform-row">
        <el-radio-group v-model="platform" size="small">
          <el-radio value="qq">QQ</el-radio>
          <el-radio value="wx">微信</el-radio>
        </el-radio-group>
      </div>
    </div>
    <div class="section connected-bar" v-else>
      <span class="connected-text">已连接</span>
      <el-button text size="small" @click="handleDisconnect">断开连接</el-button>
    </div>

    <!-- 功能开关区 -->
    <div class="section">
      <div class="section-title">功能开关</div>
      <div class="feature-grid">
        <div class="feature-group">
          <div class="group-title">自己农场</div>
          <div class="feature-item" v-for="f in farmFeatures" :key="f.key">
            <span>{{ f.label }}</span>
            <el-switch :model-value="status.features[f.key] !== false" size="small"
              @change="(v: boolean) => toggleFeature(f.key, v)" />
          </div>
        </div>
        <div class="feature-group">
          <div class="group-title">好友农场</div>
          <div class="feature-item" v-for="f in friendFeatures" :key="f.key">
            <span>{{ f.label }}</span>
            <el-switch :model-value="status.features[f.key] !== false" size="small"
              @change="(v: boolean) => toggleFeature(f.key, v)" />
          </div>
        </div>
        <div class="feature-group">
          <div class="group-title">系统</div>
          <div class="feature-item" v-for="f in systemFeatures" :key="f.key">
            <span>{{ f.label }}</span>
            <el-switch :model-value="status.features[f.key] !== false" size="small"
              @change="(v: boolean) => toggleFeature(f.key, v)" />
          </div>
        </div>
      </div>
    </div>

    <!-- 种植策略 -->
    <div class="section">
      <div class="section-title">种植策略</div>
      <div class="plant-plan" v-if="plantPlan">
        <div class="plan-info">
          <span>当前策略: <strong>{{ plantPlan.recommended?.name || '无' }}</strong> (经验最优)</span>
          <span>经验效率: {{ plantPlan.recommended?.expPerHour || 0 }} exp/h</span>
          <span>生长周期: {{ plantPlan.recommended?.growTimeWithFert || 0 }}秒(施肥后)</span>
        </div>
        <div class="plan-mode">
          <el-radio-group v-model="plantMode" size="small" @change="handlePlantModeChange">
            <el-radio value="auto">自动最优</el-radio>
            <el-radio value="manual">手动选择</el-radio>
          </el-radio-group>
          <el-select v-if="plantMode === 'manual'" v-model="plantSeedId" size="small"
            class="plant-select" @change="handlePlantSeedChange">
            <el-option v-for="opt in plantPlan.options" :key="opt.seedId"
              :label="`${opt.name} (${opt.expPerHour} exp/h)`" :value="opt.seedId" />
          </el-select>
        </div>
      </div>
      <div v-else class="plan-empty">登录后查看种植策略</div>
    </div>

    <!-- 最近操作 -->
    <div class="section">
      <div class="section-title">
        最近操作
        <el-button text size="small" @click="$router.push('/logs')">查看全部</el-button>
      </div>
      <div class="recent-logs">
        <div v-for="(log, i) in recent" :key="i" class="log-line" :class="log.level">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-msg">{{ log.message }}</span>
        </div>
        <div v-if="recent.length === 0" class="log-empty">暂无操作记录</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useBot } from '@/composables/useBot'
import { useLog } from '@/composables/useLog'
import type { PlantPlanResult } from '@/types'

const { status, connecting, connect, disconnect, toggleFeature, getConfig, saveConfig, getPlantPlan } = useBot()
const { recentLogs, loadLogs } = useLog()

const code = ref('')
const platform = ref('qq')
const plantPlan = ref<PlantPlanResult | null>(null)
const plantMode = ref('auto')
const plantSeedId = ref(0)

const recent = recentLogs(5)

const expDisplay = computed(() => {
  if (!status.connected) return '--'
  const p = status.expProgress
  if (p && p.needed > 0) return `${p.current}/${p.needed}`
  return String(status.exp)
})

const farmFeatures = [
  { key: 'autoHarvest', label: '自动收获' },
  { key: 'autoPlant', label: '自动种植' },
  { key: 'autoFertilize', label: '自动施肥' },
  { key: 'autoWeed', label: '自动除草' },
  { key: 'autoBug', label: '自动除虫' },
  { key: 'autoWater', label: '自动浇水' },
]
const friendFeatures = [
  { key: 'friendPatrol', label: '好友巡查' },
  { key: 'autoSteal', label: '自动偷菜' },
  { key: 'friendHelp', label: '帮忙操作' },
]
const systemFeatures = [
  { key: 'autoTask', label: '自动任务' },
]

async function handleConnect() {
  if (!code.value.trim()) {
    ElMessage.warning('请输入 code')
    return
  }
  const result = await connect(code.value.trim(), platform.value)
  if (result.success) {
    ElMessage.success('连接成功')
    loadPlantPlan()
    loadLogs()
  } else {
    ElMessage.error(result.error || '连接失败')
  }
}

async function handleDisconnect() {
  await disconnect()
  plantPlan.value = null
}

async function loadPlantPlan() {
  try {
    plantPlan.value = await getPlantPlan()
  } catch { /* ignore */ }
}

async function handlePlantModeChange(mode: string) {
  await saveConfig({ plantMode: mode as 'auto' | 'manual', plantSeedId: 0 })
  plantSeedId.value = 0
}

async function handlePlantSeedChange(seedId: number) {
  await saveConfig({ plantMode: 'manual', plantSeedId: seedId })
}

onMounted(async () => {
  const config = await getConfig()
  platform.value = config.platform || 'qq'
  plantMode.value = config.plantMode || 'auto'
  plantSeedId.value = config.plantSeedId || 0
  if (status.connected) {
    loadPlantPlan()
    loadLogs()
  }
})

watch(() => status.connected, (val) => {
  if (val) {
    loadPlantPlan()
    loadLogs()
  }
})
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-cards {
  display: flex;
  gap: 12px;
}

.card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 8px;
  padding: 12px 16px;
}

.card-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.card-value {
  font-size: 18px;
  font-weight: bold;
}

.card-value.gold {
  color: var(--color-warning);
}

.section {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 12px 16px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.login-input {
  flex: 1;
}

.platform-row {
  display: flex;
  align-items: center;
}

.connected-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connected-text {
  color: var(--color-success);
  font-size: 13px;
}

.feature-grid {
  display: flex;
  gap: 24px;
}

.feature-group {
  flex: 1;
}

.group-title {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.plant-plan .plan-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  margin-bottom: 10px;
}

.plan-mode {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plant-select {
  width: 220px;
}

.plan-empty {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.recent-logs {
  font-family: 'Consolas', monospace;
  font-size: 13px;
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
  font-size: 13px;
}
</style>
