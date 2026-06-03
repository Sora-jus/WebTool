<template>
  <div class="markdown-editor">
    <div class="tool-header">
      <el-page-header @back="() => router.push('/')">
        <template #content>
          <span class="tool-title">
            <el-icon><EditPen /></el-icon>
            Markdown 编辑
          </span>
        </template>
      </el-page-header>
    </div>

    <el-card class="editor-card">
      <template #header>
        <div class="card-header">
          <span>编辑器</span>
          <div class="header-actions">
            <el-button size="small" @click="clearAll" type="danger">清空</el-button>
          </div>
        </div>
      </template>
      <div class="editor-container">
        <div id="md-editor" class="monaco-editor"></div>
      </div>
    </el-card>

    <el-card class="preview-card">
      <template #header>
        <div class="card-header">
          <span>预览</span>
          <div class="header-actions">
            <el-button size="small" @click="copyOutput" type="success">复制</el-button>
            <el-button size="small" @click="downloadHtml" type="primary">导出 HTML</el-button>
          </div>
        </div>
      </template>
      <div class="preview-container">
        <div class="markdown-body" v-html="outputHtml"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import monaco from '@/monaco-config'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { EditPen } from '@element-plus/icons-vue'
import 'highlight.js/styles/github-dark.css'
import samples from './samples.json'

const router = useRouter()

// Configure marked with highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  langPrefix: 'hljs language-',
})

const inputMd = ref<string>('')
const outputHtml = ref<string>('')
const editorRef = shallowRef<monaco.editor.IStandaloneEditor | null>(null)

const initEditor = async () => {
  await nextTick()
  const editorDom = document.getElementById('md-editor')
  console.log('Initializing MD editor, DOM element:', editorDom)
  if (!editorDom || editorRef.value) {
    console.error('MD Editor DOM not found or editor already exists')
    return
  }
  try {
    editorRef.value = monaco.editor.create(editorDom, {
      value: samples.sample,
      language: 'markdown',
      theme: 'vs-dark',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      automaticLayout: true,
      readOnly: false,
    })
    console.log('MD Editor created successfully')

    inputMd.value = samples.sample
    renderMarkdown(samples.sample)

    editorRef.value.onDidChangeModelContent(() => {
      const value = editorRef.value!.getValue()
      inputMd.value = value
      renderMarkdown(value)
    })
  } catch (error) {
    console.error('Error creating MD editor:', error)
  }
}

onBeforeUnmount(() => {
  if (editorRef.value) {
    console.log('Disposing MD editor')
    editorRef.value.dispose()
    editorRef.value = null
  }
})

const renderMarkdown = (md: string) => {
  try {
    outputHtml.value = marked.parse(md) as string
  } catch (e: any) {
    outputHtml.value = `<div class="error">渲染错误：${e.message}</div>`
  }
}

const clearAll = () => {
  inputMd.value = ''
  outputHtml.value = ''
  if (editorRef.value) {
    editorRef.value.setValue('')
  }
}

const copyOutput = () => {
  if (inputMd.value) {
    navigator.clipboard.writeText(inputMd.value)
  }
}

const downloadHtml = () => {
  if (outputHtml.value) {
    const htmlContent = '<!DOCTYPE html><html><head><title>Markdown Render</title><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;padding:20px;max-width:800px;margin:0 auto;}pre{background:#f5f5f5;padding:10px;border-radius:5px;overflow-x:auto;}code{background:#f5f5f5;padding:2px 4px;border-radius:3px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#f2f2f2;}</style></head><body>' + outputHtml.value + '</body></html>'

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rendered.html'
    a.click()
    URL.revokeObjectURL(url)
  }
}

onMounted(() => {
  initEditor()
})
</script>

<style scoped>
.markdown-editor {
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
  min-height: 500px;
  height: 500px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border-color, #333);
}

.monaco-editor {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.preview-container {
  flex: 1;
  min-height: 400px;
  overflow: auto;
  padding: 15px;
  background-color: var(--bg-card);
  border-radius: 4px;
}

.markdown-body {
  line-height: 1.6;
  color: var(--text-primary);
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: var(--text-primary);
}

.markdown-body p {
  margin-bottom: 1em;
}

.markdown-body ul,
.markdown-body ol {
  margin-bottom: 1em;
  padding-left: 2em;
}

.markdown-body li {
  margin-bottom: 0.25em;
}

.markdown-body code {
  background-color: #f8f8f8;
  border-radius: 3px;
  padding: 0.2em 0.4em;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.markdown-body pre {
  background-color: #1e1e1e;
  border-radius: 3px;
  padding: 1em;
  overflow: auto;
  margin-bottom: 1em;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
  color: #d4d4d4;
}

.markdown-body blockquote {
  border-left: 4px solid var(--border-color);
  margin-left: 0;
  padding-left: 1em;
  color: var(--text-secondary);
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.markdown-body th,
.markdown-body td {
  border: 1px solid var(--border-color);
  padding: 0.5em;
  text-align: left;
}

.markdown-body th {
  background-color: var(--editor-bg);
  font-weight: bold;
}

.error {
  color: #f56c6c;
  background-color: #fef0f0;
  padding: 10px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .markdown-editor {
    padding: 12px;
  }

  .editor-card, .preview-card {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
</style>
