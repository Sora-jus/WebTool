<template>
  <div class="code-studio">
    <div class="tool-header">
      <el-page-header @back="() => router.push('/')">
        <template #content>
          <span class="tool-title">
            <el-icon><Brush /></el-icon>
            样式调制
          </span>
        </template>
      </el-page-header>
    </div>

    <el-card class="editor-card">
      <template #header>
        <div class="card-header">
          <span>代码编辑器</span>
          <div class="header-actions">
            <el-button size="small" @click="clearAll" type="danger">清空</el-button>
          </div>
        </div>
      </template>
      <div class="editor-container">
        <div id="code-editor" class="monaco-editor"></div>
      </div>
    </el-card>

    <el-card class="preview-card">
      <template #header>
        <div class="card-header">
          <span>预览</span>
          <div class="header-actions">
            <el-button size="small" @click="copyCode" type="success">复制</el-button>
          </div>
        </div>
      </template>
      <div class="preview-container">
        <div ref="previewElement" class="preview-content"></div>
      </div>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as monaco from 'monaco-editor'
import * as echarts from 'echarts'
import { Brush, ArrowLeft } from '@element-plus/icons-vue'
import samples from './samples.json'

const router = useRouter()
const inputCode = ref<string>('')
const previewElement = ref<HTMLDivElement | null>(null)
const editor: any = ref(null)
const chartInstance: any = ref(null)
const isVueComponent = ref<boolean>(false)

const initEditor = () => {
  const editorDom = document.getElementById('code-editor')
  if (editorDom && !editor.value) {
    editor.value = monaco.editor.create(editorDom, {
      value: inputCode.value,
      language: 'html',
      theme: 'vs-dark',
      minimap: { enabled: true },
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
      },
      fontSize: 14,
      lineNumbers: 'on',
      automaticLayout: true,
    })

    editor.value.onDidChangeModelContent(() => {
      const value = editor.value.getValue()
      inputCode.value = value
      renderCode(value)
    })
  }
}

const renderCode = (code: string) => {
  try {
    isVueComponent.value = code.includes('<template>') && code.includes('<script>')

    if (chartInstance.value) {
      chartInstance.value.dispose()
      chartInstance.value = null
    }

    if (previewElement.value) {
      previewElement.value.innerHTML = ''

      if (isVueComponent.value) {
        previewElement.value.innerHTML = '<div class="vue-preview-placeholder">Vue 组件渲染预览区域</div>'
      } else if (code.includes('echarts')) {
        renderChart(code)
      } else {
        previewElement.value.innerHTML = code
      }
    }
  } catch (e: any) {
    if (previewElement.value) {
      previewElement.value.innerHTML = `<div class="error">渲染错误: ${e.message}</div>`
    }
  }
}

const renderChart = (_code: string) => {
  if (!previewElement.value) return

  try {
    const chartContainer = document.createElement('div')
    chartContainer.id = 'chart-container'
    chartContainer.style.width = '100%'
    chartContainer.style.height = '400px'

    previewElement.value.appendChild(chartContainer)

    chartInstance.value = echarts.init(chartContainer)

    const option = {
      title: {
        text: '示例图表'
      },
      tooltip: {},
      xAxis: {
        data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
      },
      yAxis: {},
      series: [{
        type: 'bar',
        data: [5, 20, 36, 10, 10, 20]
      }]
    }

    chartInstance.value.setOption(option)
  } catch (e: any) {
    previewElement.value.innerHTML = `<div class="error">图表渲染错误: ${e.message}</div>`
  }
}

const clearAll = () => {
  inputCode.value = ''
  if (previewElement.value) {
    previewElement.value.innerHTML = ''
  }
  if (editor.value) {
    editor.value.setValue('')
  }
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
}

const copyCode = () => {
  if (inputCode.value) {
    navigator.clipboard.writeText(inputCode.value)
  }
}

onMounted(() => {
  initEditor()
  inputCode.value = samples.html
  renderCode(samples.html)
})
</script>

<style scoped>
.code-studio {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: var(--bg-primary);
}

.tool-header {
  margin-bottom: 4px;
}

.tool-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.editor-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
}

.editor-card, .preview-card {
  display: flex;
  flex-direction: column;
  border: var(--card-border);
  border-radius: 10px;
  box-shadow: var(--card-shadow);
  transition: box-shadow var(--transition-base);
  background: var(--bg-card);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.editor-container {
  flex: 1;
  min-height: 300px;
  border-radius: 4px;
  overflow: hidden;
}

.monaco-editor {
  width: 100%;
  height: 100%;
}

.preview-container {
  flex: 1;
  min-height: 300px;
  overflow: auto;
  padding: 15px;
  background-color: var(--bg-card);
  border-radius: 4px;
}

.preview-content {
  width: 100%;
  height: 100%;
}

.vue-preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-style: italic;
}

.error {
  color: #f56c6c;
  background-color: #fef0f0;
  padding: 10px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .code-studio {
    padding: 12px;
  }

  .editor-cards {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
</style>
