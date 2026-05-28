<template>
  <div class="app">
    <el-container class="layout-container">
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="logo">工具网站</h1>
          <el-menu
            :default-active="activeTab"
            mode="horizontal"
            @select="handleSelect"
            router
            class="header-menu"
          >
            <el-menu-item index="/json-formatter">JSON格式化</el-menu-item>
            <el-menu-item index="/markdown-editor">Markdown编辑</el-menu-item>
            <el-menu-item index="/code-studio">样式调制</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeTab = computed(() => route.path)

const handleSelect = (key: string) => {
  activeTab.value = key
}
</script>

<style scoped>
.app {
  height: 100vh;
  background-color: #f5f7fa;
}

.layout-container {
  height: 100%;
}

.app-header {
  background-color: #409eff;
  color: white;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.logo {
  margin: 0 30px 0 0;
  font-size: 20px;
  font-weight: 600;
}

.header-menu {
  flex: 1;
  border-bottom: none;
  background-color: transparent;
}

.app-main {
  padding: 20px;
  height: calc(100vh - 60px);
  overflow: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
