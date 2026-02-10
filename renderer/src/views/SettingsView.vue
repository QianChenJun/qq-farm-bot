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

    <!-- 关于项目 -->
    <div class="section">
      <div class="section-title">关于项目</div>
      <div class="about-content">
        <p class="about-text">
          <strong>QQ经典农场助手</strong> 是一个完全开源免费的项目
        </p>
        <p class="about-warning">
          ⚠️ 如果你是付费购买的，说明你被骗了！
        </p>
        <p class="about-warning">
          请立即申请退款并举报卖家！
        </p>
        <div class="about-actions">
          <el-button type="primary" size="small" @click="handleOpenAbout">
            查看完整声明
          </el-button>
          <el-button size="small" @click="handleOpenGithub">
            访问 GitHub
          </el-button>
        </div>
      </div>
    </div>

    <!-- 赞赏支持 -->
    <div class="section">
      <div class="section-title">💖 赞赏支持</div>
      <div class="donation-content">
        <p class="donation-text">如果这个项目对你有帮助，欢迎请作者喝杯咖啡 ☕</p>
        <div class="donation-images" v-if="donationImages.wechat || donationImages.alipay">
          <div class="donation-item" v-if="donationImages.wechat">
            <img :src="donationImages.wechat" alt="微信赞赏码" class="qr-code" />
            <div class="donation-label">微信赞赏</div>
          </div>
          <div class="donation-item" v-if="donationImages.alipay">
            <img :src="donationImages.alipay" alt="支付宝赞赏码" class="qr-code" />
            <div class="donation-label">支付宝赞赏</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { useBot } from '@/composables/useBot'
import type { PlantPlanResult } from '@/types'

const { status, getConfig, saveConfig, getPlantPlan } = useBot()
const openSplash = inject<() => void>('openSplash')

const farmInterval = ref(10)
const friendInterval = ref(1)
const saving = ref(false)
const plantPlan = ref<PlantPlanResult | null>(null)
const donationImages = ref<{ wechat: string | null; alipay: string | null }>({ wechat: null, alipay: null })

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

async function loadDonationImages() {
  try {
    const images = await window.electronAPI?.invoke('app:get-donation-images')
    if (images) {
      donationImages.value = images
    }
  } catch { /* ignore */ }
}

function handleOpenAbout() {
  openSplash?.()
}

function handleOpenGithub() {
  window.electronAPI?.invoke('shell:openExternal', 'https://github.com/QianChenJun/qq-farm-bot')
}

onMounted(() => {
  loadData()
  loadDonationImages()
})

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

.about-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.about-text {
  font-size: 13px;
  color: var(--color-text-primary);
  margin: 0;
}

.about-warning {
  font-size: 13px;
  color: #ff6b6b;
  font-weight: bold;
  margin: 0;
}

.about-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.donation-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.donation-text {
  font-size: 13px;
  color: var(--color-text-primary);
  margin: 0;
  text-align: center;
}

.donation-images {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.donation-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.qr-code {
  width: 160px;
  height: 160px;
  border-radius: 8px;
  border: 2px solid var(--color-border);
}

.donation-label {
  font-size: 13px;
  font-weight: bold;
  color: var(--color-text-primary);
}
</style>
