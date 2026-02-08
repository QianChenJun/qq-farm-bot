<template>
  <div class="settings-view">
    <!-- 参数配置 -->
    <div class="section">
      <div class="section-title">参数配置</div>
      <div class="config-form">
        <div class="config-row">
          <span class="config-label">农场巡查间隔</span>
          <el-input-number v-model="farmInterval" :min="1" :max="3600" size="small" />
          <span class="config-unit">秒 (最低1秒)</span>
        </div>
        <div class="config-row">
          <span class="config-label">好友巡查间隔</span>
          <el-input-number v-model="friendInterval" :min="1" :max="3600" size="small" />
          <span class="config-unit">秒 (最低1秒)</span>
        </div>
        <div class="config-actions">
          <el-button type="primary" size="small" @click="handleSave" :loading="saving">保存配置</el-button>
        </div>
      </div>
    </div>

    <!-- 种植效率排行 -->
    <div class="section">
      <div class="section-title">
        种植效率排行
        <span class="level-hint" v-if="plantPlan">基于当前等级(Lv{{ plantPlan.currentLevel }})可购买作物计算</span>
      </div>
      <el-table :data="plantPlan?.options || []" size="small" class="dark-table"
        :row-class-name="rowClassName" max-height="300">
        <el-table-column prop="rank" label="排名" width="60" align="center" />
        <el-table-column prop="name" label="作物" width="100" />
        <el-table-column label="生长时间" width="100" align="center">
          <template #default="{ row }">{{ row.growTimeWithFert }}秒</template>
        </el-table-column>
        <el-table-column label="经验/小时" width="100" align="center">
          <template #default="{ row }">{{ row.expPerHour }}</template>
        </el-table-column>
        <el-table-column label="推荐" width="60" align="center">
          <template #default="{ row }">{{ row.rank === 1 ? '★' : '' }}</template>
        </el-table-column>
      </el-table>
      <div v-if="!plantPlan" class="empty-hint">登录后查看种植效率排行</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useBot } from '@/composables/useBot'
import type { PlantPlanResult } from '@/types'

const { status, getConfig, saveConfig, getPlantPlan } = useBot()

const farmInterval = ref(10)
const friendInterval = ref(1)
const saving = ref(false)
const plantPlan = ref<PlantPlanResult | null>(null)

function rowClassName({ row }: { row: { rank: number } }) {
  return row.rank === 1 ? 'recommend-row' : ''
}

async function handleSave() {
  saving.value = true
  try {
    await saveConfig({
      farmInterval: farmInterval.value,
      friendInterval: friendInterval.value,
    })
    ElMessage.success('配置已保存')
  } finally {
    saving.value = false
  }
}

async function loadData() {
  const config = await getConfig()
  farmInterval.value = config.farmInterval || 10
  friendInterval.value = config.friendInterval || 1
  if (status.connected) {
    try { plantPlan.value = await getPlantPlan() } catch { /* ignore */ }
  }
}

onMounted(loadData)

watch(() => status.connected, (val) => {
  if (val) loadData()
})
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.level-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: normal;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-label {
  width: 110px;
  font-size: 13px;
}

.config-unit {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.config-actions {
  margin-top: 4px;
}

.dark-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.06);
  --el-table-text-color: var(--color-text);
  --el-table-header-text-color: var(--color-text-secondary);
  --el-table-border-color: var(--color-border);
}

.empty-hint {
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
