<template>
  <div class="vue-preview">
    <!-- 工具栏 -->
    <div class="preview-toolbar">
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button value="render">渲染预览</el-radio-button>
        <el-radio-button value="compiled">编译结果</el-radio-button>
        <el-radio-button value="source">原始源码</el-radio-button>
      </el-radio-group>
      <span v-if="errors.length > 0" class="error-count">
        {{ errors.length }} 个错误
      </span>
    </div>

    <!-- 渲染预览模式 -->
    <iframe
      v-show="viewMode === 'render'"
      ref="previewIframe"
      class="preview-iframe"
      sandbox="allow-scripts allow-same-origin allow-popups"
    ></iframe>

    <!-- 编译结果模式 -->
    <pre v-if="viewMode === 'compiled'" class="code-block">
      <div class="code-section" v-if="compiled.templateCode">
        <span class="section-label">📐 Template → render</span>
        <code>{{ compiled.templateCode }}</code>
      </div>
      <div class="code-section" v-if="compiled.scriptCode">
        <span class="section-label">📜 Script</span>
        <code>{{ compiled.scriptCode }}</code>
      </div>
      <div class="code-section" v-if="compiled.styleCode">
        <span class="section-label">🎨 Style</span>
        <code>{{ compiled.styleCode }}</code>
      </div>
      <div v-if="errors.length" class="code-section">
        <span class="section-label error-label">❌ Errors</span>
        <code>{{ errors.join('\n\n') }}</code>
      </div>
    </pre>

    <!-- 原始源码模式 -->
    <pre v-if="viewMode === 'source'" class="code-block source-code">{{ rawCode }}</pre>

    <!-- 错误浮层（仅渲染预览模式显示） -->
    <div v-if="errors.length > 0 && viewMode === 'render'" class="error-panel">
      <div class="error-header">
        <el-icon><WarningFilled /></el-icon>
        <span>编译错误</span>
      </div>
      <pre class="error-content">{{ errors.join('\n\n') }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import { parseVueSFC, type CompiledResult } from './vueCompiler'

interface Props {
  code: string
  fileName: string
  mockData?: Record<string, any>
  /** 其他已注册的组件，key 为组件名（如 "Button"） */
  components?: Record<string, { code: string; compiled: CompiledResult }>
}

const props = withDefaults(defineProps<Props>(), {
  mockData: () => ({}),
  components: () => ({}),
})

const viewMode = ref<'render' | 'compiled' | 'source'>('render')
const errors = ref<string[]>([])
const compiled = ref<CompiledResult>(emptyResult())
const rawCode = ref('')
const previewIframe = ref<HTMLIFrameElement | null>(null)

// 使用版本号跟踪是否需要重新渲染，避免 deep watch 带来的性能问题
const renderVersion = ref(0)

function emptyResult(): CompiledResult {
  return { code: '', templateCode: '', scriptCode: '', styleCode: '', errors: [], exportVarName: '' }
}

// =========================================
// iframe HTML 生成
// =========================================

/** Vue CDN — 使用 import map 让浏览器直接解析 bare specifier 'vue' */
const VUE_CDN = 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

function generateIframeHTML(): string {
  const c = compiled.value

  // 没有有效编译结果时展示错误或空状态
  if (!c.scriptCode && !c.templateCode) {
    const msg = c.errors.length > 0
      ? c.errors.join('\n\n')
      : '暂无内容，请在编辑器中编写 Vue SFC 代码'
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>body{font-family:monospace;padding:20px;background:#1e1e1e;color:#f56c6c;white-space:pre-wrap;font-size:13px;}</style>
</head><body>${escapeHtmlUnsafe(msg)}</body></html>`
  }

  // ---- 收集所有子组件的代码 ----
  const subDefs: string[] = []
  const subRegs: string[] = []
  for (const [compName, comp] of Object.entries(props.components)) {
    if (!comp.compiled.scriptCode && !comp.compiled.templateCode) continue
    subDefs.push(comp.compiled.scriptCode)
    subRegs.push(
      `__registeredComponents__['${compName}'] = ${comp.compiled.exportVarName};`,
    )
  }

  // ---- 主组件代码 ----
  const mainVar = c.exportVarName || '__sfc_component__'

  const allCode = [...subDefs, c.scriptCode].filter(Boolean).join('\n')
  const { imports, body } = extractImports(allCode)

  // 确保 createApp 被导入
  if (!imports.some((line) => line.includes('createApp'))) {
    imports.unshift(`import { createApp } from 'vue'`)
  }

  // 确保 h 被导入（Vue 3.4+ render 函数可能需要）
  if (!imports.some((line) => line.includes('import {') && line.includes('h') && line.includes('from'))) {
    // h is typically auto-imported by compiler; skip if not needed
  }

  // ---- 收集样式 ----
  const allStyles: string[] = []
  if (c.styleCode) allStyles.push(c.styleCode)
  for (const comp of Object.values(props.components)) {
    if (comp.compiled.styleCode) {
      allStyles.push(comp.compiled.styleCode)
    }
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
${allStyles.map((s) => `<style>${s}</style>`).join('\n')}
</head>
<body>
<div id="app"></div>
<script type="importmap">
{
  "imports": {
    "vue": "${VUE_CDN}"
  }
}
<\/script>
<script type="module">
// ---- Mock 数据 ----
var __mockData__ = ${JSON.stringify(props.mockData || {})};
var __registeredComponents__ = {};

// ---- Import 语句 ----
${imports.join('\n')}

// ---- 组件定义 ----
${body}

// ---- 子组件注册 ----
${subRegs.join('\n')}

// ---- 创建应用 ----
var App = typeof ${mainVar} !== 'undefined' ? ${mainVar} : { template: '<div style="color:#999;padding:16px;font-family:sans-serif;">组件未正确编译</div>' };
var app = createApp(App);
app.provide('mockData', __mockData__);
for (var name in __registeredComponents__) {
  if (__registeredComponents__[name]) {
    app.component(name, __registeredComponents__[name]);
  }
}
app.mount('#app');
<\/script>
</body>
</html>`
}

function extractImports(code: string): { imports: string[]; body: string } {
  const importLines: string[] = []
  const bodyLines: string[] = []

  for (const line of code.split('\n')) {
    if (/^\s*import\s/.test(line)) {
      importLines.push(line)
    } else {
      bodyLines.push(line)
    }
  }

  return { imports: importLines, body: bodyLines.join('\n') }
}

/** 对可能含 <script> 的用户 HTML 只做最基本的转义 */
function escapeHtmlUnsafe(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// =========================================
// 编译 & 渲染
// =========================================

let renderTimer: ReturnType<typeof setTimeout> | null = null

async function compileAndRender() {
  rawCode.value = props.code

  if (!props.code.trim()) {
    errors.value = []
    compiled.value = emptyResult()
    await nextTick()
    writeIframe(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;padding:16px;color:#999;}</style></head><body>代码为空</body></html>`)
    return
  }

  // 判断是否 Vue SFC
  const isVueSFC = props.code.includes('<template>') || props.code.includes('<script')

  if (!isVueSFC) {
    // 纯 HTML 直接展示
    errors.value = []
    compiled.value = emptyResult()
    await nextTick()
    writeIframe(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;padding:16px;}</style></head>
<body>${props.code}</body></html>`)
    return
  }

  // 编译 SFC
  const result = parseVueSFC(props.code, props.fileName)
  compiled.value = result
  errors.value = result.errors

  // 写入 iframe
  await nextTick()
  writeIframe(generateIframeHTML())
}

function writeIframe(html: string) {
  const iframe = previewIframe.value
  if (!iframe) return
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(html)
    doc.close()
  }
}

// 防抖：代码变化后 300ms 再重新编译
function scheduleRender() {
  if (renderTimer) clearTimeout(renderTimer)
  renderTimer = setTimeout(() => compileAndRender(), 300)
}

// 浅层监听 code、mockData、components（compiledComponents 每次返回新对象）和 renderVersion
watch(
  () => [props.code, props.mockData, props.components, renderVersion.value] as const,
  () => scheduleRender(),
)

onMounted(() => compileAndRender())

onBeforeUnmount(() => {
  if (renderTimer) clearTimeout(renderTimer)
  if (previewIframe.value) {
    const doc = previewIframe.value.contentDocument
    if (doc) { doc.open(); doc.close() }
  }
})

/** 暴露手动触发渲染的方法（供父组件在 components 变化时调用） */
defineExpose({ scheduleRender })
</script>

<style scoped>
.vue-preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-card);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #303030);
  flex-shrink: 0;
  background: var(--bg-card);
  z-index: 2;
}
.error-count {
  color: #f56c6c;
  font-size: 12px;
}

.preview-iframe {
  width: 100%;
  flex: 1;
  border: none;
  background: #fff;
}

.code-block {
  flex: 1;
  margin: 0;
  padding: 16px;
  overflow: auto;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #d4d4d4;
  background: #1e1e1e;
  white-space: pre-wrap;
  word-break: break-all;
}
.code-section { margin-bottom: 16px; }
.section-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4fc3f7;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #333;
}
.error-label { color: #f56c6c; }
.source-code { color: #d4d4d4; }

.error-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(30, 30, 30, 0.95);
  border-top: 2px solid #f56c6c;
  z-index: 10;
}
.error-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.15);
}
.error-content {
  margin: 0;
  padding: 8px 12px;
  font-family: monospace;
  font-size: 11px;
  line-height: 1.5;
  color: #f56c6c;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
