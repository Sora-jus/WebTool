import { ref, computed } from 'vue'

export interface VueFile {
  id: string
  name: string
  content: string
  isActive: boolean
}

export interface ComponentRef {
  name: string
  importPath: string
  isLocalFile: boolean
}

export function useFileManager() {
  const files = ref<VueFile[]>([])
  const activeFileId = ref<string>('')

  const activeFile = computed(() =>
      files.value.find(f => f.id === activeFileId.value) || null
  )

  const addFile = (name: string, content?: string) => {
    const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newFile: VueFile = {
      id,
      name,
      content: content ?? getDefaultContent(name),
      isActive: true,
    }

    files.value.forEach(f => (f.isActive = false))
    files.value.push(newFile)
    activeFileId.value = id

    return newFile
  }

  const removeFile = (id: string) => {
    const index = files.value.findIndex(f => f.id === id)
    if (index === -1) return

    files.value.splice(index, 1)

    if (activeFileId.value === id) {
      const nextFile = files.value[0]
      if (nextFile) {
        setActiveFile(nextFile.id)
      } else {
        activeFileId.value = ''
      }
    }
  }

  const setActiveFile = (id: string) => {
    files.value.forEach(f => {
      f.isActive = f.id === id
    })
    activeFileId.value = id
  }

  const updateFileContent = (id: string, content: string) => {
    const file = files.value.find(f => f.id === id)
    if (file) {
      file.content = content
    }
  }

  const getFileByName = (name: string) => {
    const baseName = name.replace(/\.(vue|html|json)$/, '')
    return files.value.find(
      f => f.name.replace(/\.(vue|html|json)$/, '') === baseName,
    )
  }

  const getAllFileNames = () => {
    return files.value.map(f => f.name.replace(/\.(vue|html|json)$/, ''))
  }

  /**
   * 从代码中解析 import 语句
   * @returns Array<{ name: 组件名, importPath: 导入路径, isLocalFile: 是否是本地文件 }>
   */
  const parseImports = (content: string, currentFileId?: string): ComponentRef[] => {
    const imports: ComponentRef[] = []
    const importRegex = /import\s+(?:(\w+)|\{([^}]+)\})\s+from\s+['"]([^'"]+)['"]/g

    let match: RegExpExecArray | null
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[3]
      const names = match[1] ? [match[1]] : match[2].split(',').map(s => s.trim())

      for (const name of names) {
        // 判断是否是本地文件
        const isLocalFile = importPath.startsWith('./') ||
                          importPath.startsWith('../') ||
                          importPath.startsWith('/') ||
                          (importPath.match(/^\w+\.vue$/) && !importPath.includes('/'))

        imports.push({
          name,
          importPath,
          isLocalFile,
        })
      }
    }

    return imports
  }

  /**
   * 解析模板中使用的组件标签
   * @returns Array<{ tagName: 标签名, isCustom: 是否是自定义组件 }>
   */
  const parseTemplateComponents = (content: string): { tagName: string; isCustom: boolean }[] => {
    const tags: { tagName: string; isCustom: boolean }[] = []

    // 匹配开始标签，排除自闭合标签和 void 标签
    const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)(?![^>]*\/>)[^>]*>/g
    let match: RegExpExecArray | null

    while ((match = tagRegex.exec(content)) !== null) {
      const tagName = match[1]
      // 排除 HTML 原生标签
      const isCustom = !isHtmlTag(tagName)
      if (isCustom) {
        tags.push({ tagName, isCustom })
      }
    }

    return tags
  }

  const initializeDefaultFiles = () => {
    if (files.value.length === 0) {
      addFile('App.vue')
    }
  }

  return {
    files,
    activeFileId,
    activeFile,
    addFile,
    removeFile,
    setActiveFile,
    updateFileContent,
    getFileByName,
    getAllFileNames,
    parseImports,
    parseTemplateComponents,
    initializeDefaultFiles,
  }
}

function getDefaultContent(fileName: string): string {
  const baseName = fileName.replace(/\.(vue|html|json)$/, '')

  if (fileName.endsWith('.html')) {
    return `<div class="container">
  <h1>${baseName}</h1>
  <p>HTML 预览</p>
</div>
<style>
.container { padding: 20px; }
</style>`
  }

  // 默认 Vue SFC
  return `<template>
  <div class="${baseName.toLowerCase()}">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button @click="changeMessage">点击改变消息</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('${baseName} 组件')
const message = ref('欢迎使用 Vue 预览')

const changeMessage = () => {
  message.value = '消息已改变！'
}
</script>

<style scoped>
.${baseName.toLowerCase()} {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  max-width: 400px;
}
.${baseName.toLowerCase()} h1 {
  margin-bottom: 8px;
}
.${baseName.toLowerCase()} button {
  margin-top: 12px;
  padding: 6px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.${baseName.toLowerCase()} button:hover {
  background: #66b1ff;
}
</style>
`
}

const HTML_TAGS = new Set([
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
  'form', 'input', 'button', 'select', 'option', 'textarea',
  'img', 'a', 'br', 'hr', 'section', 'article', 'aside', 'header',
  'footer', 'nav', 'main', 'figure', 'figcaption', 'details', 'summary',
  'dialog', 'slot', 'template', 'component', 'transition', 'keep-alive',
  'teleport', 'suspense', 'fragment',
])

function isHtmlTag(tag: string): boolean {
  return HTML_TAGS.has(tag.toLowerCase())
}