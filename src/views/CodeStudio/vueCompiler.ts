import * as vueCompiler from '@vue/compiler-sfc'

export interface CompiledResult {
  code: string
  templateCode: string
  scriptCode: string
  styleCode: string
  errors: string[]
  /** 编译后默认导出的变量名（用于 iframe 内注册组件） */
  exportVarName: string
}

/**
 * 解析 Vue SFC，返回各部分代码和错误信息
 */
export function parseVueSFC(content: string, fileName: string = 'App.vue'): CompiledResult {
  const empty: CompiledResult = {
    code: '',
    templateCode: '',
    scriptCode: '',
    styleCode: '',
    errors: [],
    exportVarName: '',
  }

  const errors: string[] = []

  // 剥离 <script> 标签上的 lang="ts" / lang="tsx"，避免编译器在 inlineTemplate 模式
  // 输出 TypeScript 类型注解（如 _ctx: any），这些注解在浏览器 iframe 中会语法报错。
  // 用户代码中的 TS 特有语法不会被转换，因此推荐使用纯 JavaScript 编写。
  const cleanedContent = content.replace(
    /(<script\b[^>]*)\blang\s*=\s*["'](?:ts|tsx)["']([^>]*>)/g,
    '$1$2',
  )

  try {
    const { descriptor, errors: sfcErrors } = vueCompiler.parse(cleanedContent, {
      filename: fileName,
      sourceMap: false,
    })

    if (sfcErrors && sfcErrors.length > 0) {
      return { ...empty, errors: sfcErrors.map((e: any) => e.message || String(e)) }
    }

    // 为每个组件生成唯一变量名，避免 iframe 中多组件冲突
    const safeName = fileName
      .replace(/\.vue$/i, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
    const exportVarName = `__sfc_${safeName}__`
    const scopeId = `data-v-${safeName}`

    // ---- 编译模板 ----
    let templateCode = ''
    if (descriptor.template) {
      try {
        const compiled = vueCompiler.compileTemplate({
          source: descriptor.template.content,
          id: scopeId,
          filename: fileName,
          scoped: !!descriptor.styles.some((s: any) => s.scoped),
          slotted: descriptor.slotted,
          ssr: false,
        })
        if (compiled.errors && compiled.errors.length > 0) {
          errors.push(...compiled.errors.map((e: any) => e.message || String(e)))
        } else {
          templateCode = compiled.code
        }
      } catch (e: any) {
        errors.push(`模板编译错误: ${e.message}`)
      }
    }

    // ---- 编译脚本 ----
    // 使用 inlineTemplate: true，让 render 函数内联到脚本中，方便 iframe 中执行
    let scriptCode = ''

    if (descriptor.scriptSetup || descriptor.script) {
      try {
        const compiled = vueCompiler.compileScript(descriptor, {
          id: scopeId,
          inlineTemplate: true,
          templateOptions: {
            id: scopeId,
            filename: fileName,
            scoped: !!descriptor.styles.some((s: any) => s.scoped),
            slotted: descriptor.slotted,
            ssr: false,
          },
        })
        // 替换 export default 为变量赋值
        scriptCode = compiled.content.replace(
          /export\s+default\s+/,
          `const ${exportVarName} = `,
        )
      } catch (e: any) {
        errors.push(`脚本编译错误: ${e.message}`)
      }
    } else if (templateCode) {
      // 只有 template 没有 script，生成一个壳组件
      scriptCode = `import { defineComponent, toDisplayString as _toDisplayString, createVNode as _createVNode } from 'vue'
const ${exportVarName} = defineComponent({
  render: function render(_ctx, _cache) {
    ${templateCode.replace(/export function render\([^)]*\)\s*\{/, '').replace(/\}\s*$/, '')}
    return null
  }
})
`
      templateCode = ''
    }

    // ---- 编译样式 ----
    let styleCode = ''
    if (descriptor.styles.length > 0) {
      const styleParts: string[] = []
      for (const style of descriptor.styles) {
        try {
          const result = vueCompiler.compileStyle({
            source: style.content,
            filename: fileName,
            id: scopeId,
            scoped: style.scoped ?? false,
            preprocessLang: style.lang as any,
            modules: style.module !== undefined,
          })
          if (result.errors && result.errors.length > 0) {
            errors.push(...result.errors.map((e: any) => e.message || String(e)))
          } else {
            styleParts.push(result.code)
          }
        } catch (e: any) {
          errors.push(`样式编译错误: ${e.message}`)
        }
      }
      styleCode = styleParts.join('\n')
    }

    return {
      code: [templateCode, scriptCode].filter(Boolean).join('\n\n'),
      templateCode,
      scriptCode,
      styleCode,
      errors,
      exportVarName,
    }
  } catch (e: any) {
    return { ...empty, errors: [`SFC 解析错误: ${e.message}`] }
  }
}

/**
 * 从代码中解析 import 语句，获取组件引用信息
 */
export function parseComponentImports(code: string): { name: string; path: string }[] {
  const imports: { name: string; path: string }[] = []
  const regex = /import\s+(?:(\w+)|\{([^}]+)\})\s+from\s+['"]([^'"]+)['"]/g

  let match: RegExpExecArray | null
  while ((match = regex.exec(code)) !== null) {
    const names = match[1] ? [match[1]] : match[2].split(',').map((s) => s.trim())
    const path = match[3]
    for (const name of names) {
      imports.push({ name, path })
    }
  }

  return imports
}
