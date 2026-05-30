import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import JsonFormatter from '../views/JsonFormatter/JsonFormatter.vue'
import MarkdownEditor from '../views/MarkdownEditor/MarkdownEditor.vue'
import CodeStudio from '../views/CodeStudio/CodeStudio.vue'
import Home from '../views/Home.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/json-formatter',
    name: 'JsonFormatter',
    component: JsonFormatter,
  },
  {
    path: '/markdown-editor',
    name: 'MarkdownEditor',
    component: MarkdownEditor,
  },
  {
    path: '/code-studio',
    name: 'CodeStudio',
    component: CodeStudio,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
