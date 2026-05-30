<template>
  <div class="json-formatter">
    <div class="tool-header">
      <el-page-header @back="() => router.push('/')">
        <template #content>
          <span class="tool-title">
            <el-icon><DocumentChecked /></el-icon>
            JSON 格式化
          </span>
        </template>
      </el-page-header>
    </div>

    <el-card class="json-card">
      <template #header>
        <div class="card-header">
          <span>输入 JSON</span>
          <div class="header-actions">
            <el-button-group>
              <el-button
                  :type="formatType === 'pretty' ? 'primary' : ''"
                  @click="formatType = 'pretty'; formatJsonHandler()"
                  size="small"
              >格式化</el-button
              >
              <el-button
                  :type="formatType === 'compact' ? 'primary' : ''"
                  @click="formatType = 'compact'; compressJson()"
                  size="small"
              >压缩</el-button
              >
              <el-button size="small" @click="validateJsonHandler">校验</el-button>
              <el-button size="small" @click="clearAll" type="danger"
              >清空</el-button
              >
            </el-button-group>
          </div>
        </div>
      </template>
      <div class="editor-container">
        <div id="json-editor" class="monaco-editor"></div>
      </div>
      <div v-if="errorMsg" class="error-message" :class="errorMsg.includes('正确') ? 'success' : 'error'">
        {{ errorMsg }}
      </div>
    </el-card>

    <el-card class="json-card">
      <template #header>
        <div class="card-header">
          <span>输出结果</span>
          <div class="header-actions">
            <el-button-group>
              <el-button size="small" @click="copyOutput" type="success"
              >复制</el-button
              >
              <el-button size="small" @click="downloadOutput" type="primary"
              >下载</el-button
              >
            </el-button-group>
          </div>
        </div>
      </template>
      <div class="output-container">
        <pre class="output-content">{{ outputJson }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as monaco from 'monaco-editor'
import { DocumentChecked, ArrowLeft } from '@element-plus/icons-vue'
import { formatJson, validateJson } from './utils'

const router = useRouter()
const inputJson = ref<string>('')
const outputJson = ref<string>('')
const errorMsg = ref<string>('')
const formatType = ref<'pretty' | 'compact'>('pretty')
let editor: any = null

const initEditor = () => {
  const editorDom = document.getElementById('json-editor')
  if (editorDom && !editor) {
    editor = monaco.editor.create(editorDom, {
      value: inputJson.value,
      language: 'json',
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

    editor.onDidChangeModelContent(() => {
      const value = editor.getValue()
      inputJson.value = value
      if (formatType.value === 'pretty') {
        formatJsonHandler()
      } else {
        compressJson()
      }
    })
  }
}

const formatJsonHandler = () => {
  errorMsg.value = ''
  try {
    const input = inputJson.value.trim()
    if (!input) {
      outputJson.value = ''
      return
    }
    outputJson.value = formatJson(input, true)
  } catch (e: any) {
    errorMsg.value = `JSON格式错误: ${e.message}`
    outputJson.value = ''
  }
}

const compressJson = () => {
  errorMsg.value = ''
  try {
    const input = inputJson.value.trim()
    if (!input) {
      outputJson.value = ''
      return
    }
    outputJson.value = formatJson(input, false)
  } catch (e: any) {
    errorMsg.value = `JSON格式错误: ${e.message}`
    outputJson.value = ''
  }
}

const validateJsonHandler = () => {
  errorMsg.value = ''
  try {
    const input = inputJson.value.trim()
    if (!input) {
      errorMsg.value = '请输入JSON内容'
      return
    }
    if (validateJson(input)) {
      errorMsg.value = 'JSON格式正确'
    } else {
      errorMsg.value = 'JSON格式错误'
    }
  } catch (e: any) {
    errorMsg.value = `JSON格式错误: ${e.message}`
  }
}

const clearAll = () => {
  inputJson.value = ''
  outputJson.value = ''
  errorMsg.value = ''
  if (editor) {
    editor.setValue('')
  }
}

const copyOutput = () => {
  if (outputJson.value) {
    navigator.clipboard.writeText(outputJson.value)
  }
}

const downloadOutput = () => {
  if (outputJson.value) {
    const blob = new Blob([outputJson.value], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formatted.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}

onMounted(() => {
  initEditor()
})
</script>

<style scoped>
.json-formatter {
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

.json-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
}

.json-card {
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

.output-container {
  flex: 1;
  min-height: 300px;
  background-color: #1e1e1e;
  border-radius: 4px;
  overflow: hidden;
}

.output-content {
  margin: 0;
  padding: 15px;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: auto;
  height: 100%;
  font-family: 'Consolas', 'Monaco', monospace;
}

.error-message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
}

.error-message.error {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #feb2b2;
}

.error-message.success {
  background-color: #f0f9ff;
  color: #67c23a;
  border: 1px solid #a3e635;
}

@media (max-width: 768px) {
  .json-formatter {
    padding: 12px;
  }

  .json-cards {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
</style>
