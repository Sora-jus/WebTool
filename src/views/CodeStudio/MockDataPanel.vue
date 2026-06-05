<template>
  <div class="mock-data-panel">
    <div class="panel-header">
      <span class="panel-title">
        <el-icon><Grid /></el-icon>
        Mock 数据
      </span>
      <el-button size="small" type="primary" @click="addMockItem">
        <el-icon><Plus /></el-icon>
      </el-button>
    </div>

    <div class="mock-list">
      <!-- 快速添加已有组件 -->
      <div v-if="availableComponents.length > 0 && mockList.length === 0" class="quick-add-hint">
        <span>检测到 {{ availableComponents.length }} 个组件，</span>
        <el-button size="small" text type="primary" @click="addAllComponents">一键添加</el-button>
      </div>

      <div v-for="(item, index) in mockList" :key="index" class="mock-item">
        <div class="mock-item-header">
          <el-select
            v-model="item.componentName"
            placeholder="选择/输入组件名"
            size="small"
            filterable
            allow-create
            @change="updateMock"
          >
            <el-option
              v-for="name in availableComponents"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
          <el-button size="small" text type="danger" @click="removeMockItem(index)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <div class="mock-item-body">
          <el-input
            v-model="item.mockJson"
            type="textarea"
            :rows="4"
            placeholder='{"title": "Hello", "count": 42}'
            size="small"
            @change="updateMock"
          />
          <div v-if="item.error" class="json-error">
            <el-icon><WarningFilled /></el-icon>
            {{ item.error }}
          </div>
        </div>
      </div>

      <el-empty v-if="mockList.length === 0" description="暂无 Mock 数据" :image-size="60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Grid, Plus, Delete, WarningFilled } from '@element-plus/icons-vue'

interface MockItem {
  componentName: string
  mockJson: string
  error: string
}

const props = defineProps<{
  modelValue: Record<string, any>
  availableComponents?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const mockList = ref<MockItem[]>([])

const addMockItem = () => {
  mockList.value.push({
    componentName: '',
    mockJson: '{\n  \n}',
    error: '',
  })
}

const removeMockItem = (index: number) => {
  mockList.value.splice(index, 1)
  updateMock()
}

/** 一键添加所有已检测到的组件 */
const addAllComponents = () => {
  for (const name of props.availableComponents || []) {
    if (!mockList.value.find(m => m.componentName === name)) {
      mockList.value.push({
        componentName: name,
        mockJson: '{\n  \n}',
        error: '',
      })
    }
  }
  updateMock()
}

const updateMock = () => {
  const result: Record<string, any> = {}
  for (const item of mockList.value) {
    if (!item.componentName) continue
    try {
      result[item.componentName] = JSON.parse(item.mockJson || '{}')
      item.error = ''
    } catch (_e) {
      item.error = 'JSON 格式错误'
    }
  }
  emit('update:modelValue', result)
}

// 外部数据变化时同步到内部列表
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal || Object.keys(newVal).length === 0) return
    mockList.value = Object.entries(newVal).map(([key, value]) => ({
      componentName: key,
      mockJson: JSON.stringify(value, null, 2),
      error: '',
    }))
  },
  { immediate: true, deep: true },
)
</script>

<style scoped>
.mock-data-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color, #333);
  flex-shrink: 0;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.mock-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.quick-add-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--text-secondary, #999);
  background: rgba(64, 158, 255, 0.08);
  border-radius: 6px;
  margin-bottom: 8px;
}
.mock-item {
  margin-bottom: 10px;
  padding: 10px;
  background: var(--bg-primary);
  border-radius: 6px;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}
.mock-item:hover {
  border-color: var(--border-color, #444);
}
.mock-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.mock-item-header .el-select {
  flex: 1;
}
.mock-item-body {
  position: relative;
}
.mock-item-body :deep(.el-textarea__inner) {
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
}
.json-error {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f56c6c;
  font-size: 11px;
  margin-top: 4px;
}
</style>
