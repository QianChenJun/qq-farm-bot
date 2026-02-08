import { reactive, computed } from 'vue'
import type { LogEntry } from '@/types'

const MAX_LOGS = 1000
const logs = reactive<LogEntry[]>([])

async function loadLogs() {
  const data = await window.electronAPI.invoke('bot:get-logs')
  logs.splice(0, logs.length, ...data)
}

async function clearLogs() {
  await window.electronAPI.invoke('bot:clear-logs')
  logs.splice(0, logs.length)
}

function filteredLogs(categories: Set<string>) {
  return computed(() => {
    if (categories.size === 0) return logs
    return logs.filter(l => categories.has(l.category))
  })
}

function recentLogs(count: number) {
  return computed(() => logs.slice(-count))
}

// Listen for log pushes from main process
if (window.electronAPI) {
  window.electronAPI.on('bot:log', (entry: LogEntry) => {
    logs.push(entry)
    if (logs.length > MAX_LOGS) logs.shift()
  })
}

export function useLog() {
  return {
    logs,
    loadLogs,
    clearLogs,
    filteredLogs,
    recentLogs,
  }
}
