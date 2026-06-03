<template>
  <el-menu
    :default-active="activeTab"
    mode="horizontal"
    @select="handleSelect"
    router
    class="header-menu"
  >
    <el-menu-item index="/json-formatter">
      <el-icon><DocumentChecked /></el-icon>
      <span>JSON格式化</span>
    </el-menu-item>
    <el-menu-item index="/markdown-editor">
      <el-icon><EditPen /></el-icon>
      <span>Markdown编辑</span>
    </el-menu-item>
    <el-menu-item index="/code-studio">
      <el-icon><Brush /></el-icon>
      <span>样式调制</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DocumentChecked, EditPen, Brush } from '@element-plus/icons-vue'

const route = useRoute()

const activeTab = computed(() => route.path)

const handleSelect = (_key: string) => {
  // el-menu with router mode handles navigation automatically
}
</script>

<style scoped>
.header-menu {
  flex: 1;
  border-bottom: none !important;
  background-color: transparent !important;
}

:deep(.el-menu--horizontal) {
  border-bottom: none !important;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
  transition: color var(--transition-base), background-color var(--transition-base);
}

:deep(.el-menu-item:hover) {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.12) !important;
}

:deep(.el-menu-item.is-active) {
  color: #ffffff;
  font-weight: 600;
}

:deep(.el-menu--horizontal > .el-menu-item.is-active) {
  border-bottom: 2px solid #ffffff !important;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 6px;
}
</style>
