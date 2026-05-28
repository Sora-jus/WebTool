<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import * as monaco from 'monaco-editor'
import * as echarts from 'echarts'
import samples from './samples.json'

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
    // 简单检测是否为Vue组件代码
    isVueComponent.value = code.includes('<template>') && code.includes('<script>')

    // 清除之前的图表实例
    if (chartInstance.value) {
      chartInstance.value.dispose()
      chartInstance.value = null
    }

    // 如果有预览容器，清除内容
    if (previewElement.value) {
      previewElement.value.innerHTML = ''

      // 如果是Vue组件，尝试渲染它
      if (isVueComponent.value) {
        // 对于Vue组件，我们使用一个简单的方法进行预览
        // 这里可以集成Vue的编译器或者使用iframe
        previewElement.value.innerHTML = '<div class="vue-preview-placeholder">Vue组件渲染预览区域</div>'
      } else if (code.includes('echarts')) {
        // 处理ECharts图表
        renderChart(code)
      } else {
        // 简单的HTML内容直接插入
        previewElement.value.innerHTML = code
      }
    }
  } catch (e: any) {
    if (previewElement.value) {
      previewElement.value.innerHTML = `<div class="error">渲染错误: ${e.message}</div>`
    }
  }
}

const renderChart = (code: string) => {
  if (!previewElement.value) return

  // 尝试从代码中提取ECharts配置
  try {
    // 在实际环境中，应该用更安全的方式解析代码
    // 这里我们简化处理

    // 为图表创建一个容器
    const chartContainer = document.createElement('div')
    chartContainer.id = 'chart-container'
    chartContainer.style.width = '100%'
    chartContainer.style.height = '400px'

    previewElement.value.appendChild(chartContainer)

    // 创建图表实例
    chartInstance.value = echarts.init(chartContainer)

    // 示例配置
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
  // 初始化编辑器
  initEditor()

  // 设置默认示例内容
  inputCode.value = samples.html
  renderCode(samples.html)
})
</script>

<template>
  <div class="code-studio">
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

<style scoped>
.code-studio {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: calc(100vh - 140px);
}

.editor-card, .preview-card {
  flex: 1;
  display: flex;
  flex-direction: column;
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
  background-color: #ffffff;
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
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
</style>