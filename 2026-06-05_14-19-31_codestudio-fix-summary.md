# CodeStudio 修复总结

> 修复时间：2026-06-05 14:19

## 修复的问题

### 1. 界面打开没有内容

**根因**：`MainLayout.vue` 使用 `<slot />` 但 `App.vue` 没有任何子内容传入，且整个项目缺少 `<router-view />` 组件，路由无法渲染页面。

**修复**：`src/layout/MainLayout.vue` — 将 `<el-main>` 内的 `<slot />` 替换为 `<router-view />`。

---

### 2. VuePreview 渲染预览失败

共 4 个独立 Bug：

| Bug | 文件 | 修复方式 |
|-----|------|----------|
| 变量 `cc` 未定义，应为 `comp.compiled` | `VuePreview.vue` | `cc.scriptCode` → `comp.compiled.scriptCode` |
| iframe HTML 缺少 `<script>` 标签，import 无法执行 | `VuePreview.vue` | 重写 `generateIframeHTML()`：添加 `<script type="importmap">` 指向 Vue CDN、用 `<script type="module">` 包裹所有 ES 模块代码 |
| `lang="ts"` 导致编译器输出 TS 类型注解（`_ctx: any`），浏览器报 SyntaxError | `vueCompiler.ts` | 在 `parse()` 前用正则剥离 `<script>` 标签上的 `lang="ts"` / `lang="tsx"` |
| 默认模板使用 `lang="ts"` 导致编译产物含 TS 语法 | `useFileManager.ts` | 默认模板的 `<script setup lang="ts">` 改为 `<script setup>` |
| 模板字面量内 `</script>` 未转义，触发 Vue SFC 编译错误 | `VuePreview.vue` | `</script>` → `<\/script>` |

---

### 3. 界面卡顿（性能问题）

**根因**：`CodeStudio.vue` 在每次按键时触发 `compiledVersion++`，导致 `compiledComponents` computed 用 `parseVueSFC` 重新编译**所有文件**（O(n) 每按键一次）。

**修复**：
- `CodeStudio.vue` — 用 `shallowReactive` 构建**按文件编译缓存**，每次按键只重新编译当前活动文件
- `VuePreview.vue` — 去掉 `{ deep: true }` deep watch（遍历所有嵌套对象开销极大），改用浅层引用比较 + `renderVersion` 精确触发渲染

---

## 修改的文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/layout/MainLayout.vue` | 修改 | `<slot />` → `<router-view />` |
| `src/views/CodeStudio/CodeStudio.vue` | 重写 | 编译缓存 + 性能优化 |
| `src/views/CodeStudio/VuePreview.vue` | 重写 | 修复 HTML 生成 + cc bug + TS 剥离 |
| `src/views/CodeStudio/vueCompiler.ts` | 修改 | `inlineTemplate: true` + 剥离 `lang="ts"` |
| `src/views/CodeStudio/useFileManager.ts` | 修改 | 默认模板去除 `lang="ts"` |

## 架构要点

- **编译管线**：`parseVueSFC` → 剥离 `lang="ts"` → `compileScript`（inlineTemplate）→ 替换 `export default` 为变量赋值 → 输出纯 JS
- **iframe 渲染**：import map 将 `vue` 映射到 `unpkg.com/vue@3/dist/vue.esm-browser.js`，所有组件代码在 `<script type="module">` 中执行
- **性能策略**：`shallowReactive` 缓存 + 仅编译活动文件 + 300ms 防抖 + 浅层 watch
