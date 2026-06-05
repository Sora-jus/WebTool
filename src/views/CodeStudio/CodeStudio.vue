<template>
  <div class="code-studio">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <el-page-header @back="() => router.push('/')">
        <template #content>
          <span class="tool-title">
            <el-icon><Brush /></el-icon>
            代码工作室
          </span>
        </template>
        <template #extra>
          <el-button
            size="small"
            @click="showMockPanel = !showMockPanel"
            :type="showMockPanel ? 'primary' : 'default'"
          >
            <el-icon><Grid /></el-icon>
            Mock 数据
          </el-button>
        </template>
      </el-page-header>
    </div>

    <!-- 主工作区 -->
    <div class="studio-main">
      <!-- 左侧：文件列表 -->
      <aside class="file-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">📁 文件</span>
          <el-dropdown trigger="click" @command="handleAddFileCommand">
            <el-button size="small" type="primary" circle>
              <el-icon><Plus /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="vue">Vue 组件</el-dropdown-item>
                <el-dropdown-item command="html">HTML 文件</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="file-list">
          <div
            v-for="file in files"
            :key="file.id"
            :class="['file-item', { active: file.id === activeFileId }]"
            @click="switchToFile(file.id)"
          >
            <span class="file-icon">{{ getFileIcon(file.name) }}</span>
            <span class="file-name" :title="file.name">{{ file.name }}</span>
            <el-button
              v-if="files.length > 1"
              size="small"
              text
              class="file-close"
              @click.stop="handleRemoveFile(file.id)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div v-if="files.length === 0" class="empty-hint">点击 + 新建文件</div>
        </div>
      </aside>

      <!-- 中间：编辑器 + 预览 -->
      <main class="editor-preview-area">
        <!-- 编辑器面板 -->
        <section class="panel editor-panel">
          <div class="panel-header">
            <span class="panel-label">
              <el-icon><EditPen /></el-icon>
              编辑器
              <span v-if="activeFile" class="file-path">{{ activeFile.name }}</span>
            </span>
          </div>
          <div id="code-editor" class="monaco-editor"></div>
        </section>

        <!-- 预览面板 -->
        <section class="panel preview-panel">
          <VuePreview
            ref="vuePreviewRef"
            :code="activeFile?.content || ''"
            :file-name="activeFile?.name || 'untitled.vue'"
            :mock-data="mockData"
            :components="compiledComponents"
          />
        </section>
      </main>

      <!-- 右侧：Mock 数据面板 -->
      <aside v-if="showMockPanel" class="mock-sidebar">
        <MockDataPanel v-model="mockData" :available-components="allComponentNames" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, shallowReactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Brush, Grid, Plus, Close, EditPen } from '@element-plus/icons-vue'
import monaco from '@/monaco-config'
import { useFileManager } from './useFileManager'
import { parseVueSFC, type CompiledResult } from './vueCompiler'
import VuePreview from './VuePreview.vue'
import MockDataPanel from './MockDataPanel.vue'

const router = useRouter()

// ---- 文件管理 ----
const {
  files,
  activeFileId,
  activeFile,
  addFile,
  removeFile,
  setActiveFile,
  updateFileContent,
  initializeDefaultFiles,
} = useFileManager()

// ---- 编辑器 ----
const editorRef = ref<monaco.editor.IStandaloneCodeEditor | null>(null)
const vuePreviewRef = ref<InstanceType<typeof VuePreview> | null>(null)

// ---- Mock 数据 ----
const showMockPanel = ref(false)
const mockData = ref<Record<string, any>>({})

// ---- 编译缓存 ----
// 使用 shallowReactive：只追踪 key 的增删，不解包 value 内部
// 每个 value 是 { code, compiled } 的快照，只在对应文件变化时整体替换
const compiledCache = shallowReactive<Record<string, { code: string; compiled: CompiledResult }>>({})

/** 编译单个文件并更新缓存 */
function compileFile(file: { id: string; name: string; content: string }) {
  const name = file.name.replace(/\.(vue|html)$/, '')
  compiledCache[name] = {
    code: file.content,
    compiled: parseVueSFC(file.content, file.name),
  }
}

/** 从缓存中移除文件 */
function removeFromCache(file: { id: string; name: string }) {
  const name = file.name.replace(/\.(vue|html)$/, '')
  delete compiledCache[name]
}

/** 编译所有文件（仅在初始化/增删文件时调用） */
function rebuildAllCache() {
  // 先清理不存在的 key
  const activeNames = new Set(files.value.map(f => f.name.replace(/\.(vue|html)$/, '')))
  for (const key of Object.keys(compiledCache)) {
    if (!activeNames.has(key)) delete compiledCache[key]
  }
  for (const f of files.value) {
    compileFile(f)
  }
}

/** 传给 VuePreview 的组件列表 */
const compiledComponents = computed(() => {
  // 直接返回缓存引用，shallowReactive 确保 key 变化触发 computed 重新求值
  // 过滤掉当前活动文件自身（避免自己导入自己）
  const result: Record<string, { code: string; compiled: CompiledResult }> = {}
  const activeName = activeFile.value?.name.replace(/\.(vue|html)$/, '') || ''
  for (const [k, v] of Object.entries(compiledCache)) {
    if (k !== activeName) {
      result[k] = v
    }
  }
  return result
})

/** 所有已注册的组件名列表 */
const allComponentNames = computed(() =>
  files.value.map(f => f.name.replace(/\.(vue|html)$/, '')),
)

// ---- 初始化编辑器 ----
const initEditor = async () => {
  await nextTick()
  const dom = document.getElementById('code-editor')
  if (!dom || editorRef.value) return

  initializeDefaultFiles()

  // 初始化编译缓存
  rebuildAllCache()

  editorRef.value = monaco.editor.create(dom, {
    value: activeFile.value?.content || '',
    language: 'html',
    theme: 'vs-dark',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    automaticLayout: true,
    wordWrap: 'on',
    tabSize: 2,
  })

  // 编辑内容变化 → 只更新当前文件的缓存
  editorRef.value.onDidChangeModelContent(() => {
    const val = editorRef.value?.getValue() ?? ''
    if (activeFile.value) {
      updateFileContent(activeFile.value.id, val)
      // 只重新编译当前文件
      compileFile(activeFile.value)
      // 通知预览组件刷新
      vuePreviewRef.value?.scheduleRender()
    }
  })
}

// ---- 切换文件 ----
const switchToFile = (id: string) => {
  if (id === activeFileId.value) return

  // 保存当前编辑器内容到当前文件 & 更新缓存
  if (editorRef.value && activeFile.value) {
    updateFileContent(activeFile.value.id, editorRef.value.getValue())
    compileFile(activeFile.value)
  }

  setActiveFile(id)

  // 切换后加载新文件内容到编辑器
  nextTick(() => {
    if (editorRef.value && activeFile.value) {
      editorRef.value.setValue(activeFile.value.content)
    }
  })
}

// ---- 新建文件 ----
const handleAddFileCommand = async (type: string) => {
  const placeholder = type === 'vue' ? 'MyComponent' : 'page'
  const suffix = type === 'vue' ? '.vue' : '.html'

  const name = await ElMessageBox.prompt(
    `新建 ${type.toUpperCase()} 文件`,
    '创建文件',
    {
      confirmButtonText: '创建',
      cancelButtonText: '取消',
      inputPlaceholder: `例如: ${placeholder}`,
      inputPattern: /^[A-Za-z][A-Za-z0-9_-]*$/,
      inputErrorMessage: '请输入有效的文件名（英文开头）',
    },
  ).catch(() => null)

  if (name?.value) {
    const fullName = name.value.endsWith(suffix) ? name.value : `${name.value}${suffix}`
    const newFile = addFile(fullName)
    compileFile(newFile)
    nextTick(() => {
      if (editorRef.value && activeFile.value) {
        editorRef.value.setValue(activeFile.value.content)
      }
    })
  }
}

// ---- 删除文件 ----
const handleRemoveFile = async (id: string) => {
  const file = files.value.find(f => f.id === id)
  if (!file) return

  await ElMessageBox.confirm(
    `确定删除 "${file.name}" 吗？`,
    '确认删除',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
  ).catch(() => null)

  removeFromCache(file)
  removeFile(id)
}

// ---- 工具函数 ----
function getFileIcon(name: string): string {
  if (name.endsWith('.vue')) return '🎨'
  if (name.endsWith('.html')) return '🌐'
  if (name.endsWith('.json')) return '📋'
  return '📄'
}

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.dispose()
    editorRef.value = null
  }
})

onMounted(() => {
  initEditor()
})
</script>

<style scoped>
.code-studio {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  padding: 12px;
  gap: 12px;
  background-color: var(--bg-primary);
  overflow: hidden;
}

/* 顶部 */
.tool-header { flex-shrink: 0; }
.tool-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 主工作区布局 */
.studio-main {
  display: flex;
  flex: 1;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

/* 左侧文件栏 */
.file-sidebar {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color, #333);
  overflow: hidden;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color, #333);
}
.sidebar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.file-list { flex: 1; overflow-y: auto; padding: 4px; }
.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  font-size: 13px;
}
.file-item:hover { background: rgba(255, 255, 255, 0.05); }
.file-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.file-icon { font-size: 14px; flex-shrink: 0; }
.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}
.file-close {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
  padding: 2px !important;
}
.file-item:hover .file-close { opacity: 1; }
.empty-hint { text-align: center; color: #666; padding: 20px 10px; font-size: 12px; }

/* 中间编辑+预览区 */
.editor-preview-area {
  flex: 1;
  display: flex;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}
.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color, #333);
  overflow: hidden;
  min-width: 0;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #333);
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-secondary, #999);
}
.panel-label { display: flex; align-items: center; gap: 4px; }
.file-path {
  font-size: 11px;
  color: var(--el-color-primary);
  margin-left: auto;
  font-family: monospace;
}
.monaco-editor { width: 100%; height: 100%; }

/* 右侧 Mock 面板 */
.mock-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color, #333);
  overflow: hidden;
}

/* 响应式 */
@media (max-width: 1024px) {
  .studio-main { flex-direction: column; }
  .file-sidebar { width: 100%; flex-direction: row; max-height: 120px; }
  .sidebar-header { border-bottom: none; border-right: 1px solid var(--border-color, #333); }
  .file-list { display: flex; overflow-x: auto; overflow-y: hidden; }
  .file-item { white-space: nowrap; border-bottom: none; }
  .mock-sidebar { width: 100%; }
  .editor-preview-area { flex-direction: column; }
}
</style>
