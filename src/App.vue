<template>
  <div class="app">
    <el-container class="layout-container">
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo">
            <el-icon :size="24"><Tools /></el-icon>
            <span>工具网站</span>
          </div>
          <AppMenu />
          <div class="header-right">
            <el-button
              class="theme-toggle"
              text
              @click="themeStore.toggleTheme"
              :title="themeStore.theme.theme === 'dark' ? '切换浅色模式' : '切换深色模式'"
            >
              <el-icon :size="20">
                <Sunny v-if="themeStore.theme.theme === 'dark'" />
                <Moon v-else />
              </el-icon>
            </el-button>
          </div>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { Tools, Sunny, Moon } from '@element-plus/icons-vue'
import AppMenu from '@/components/AppMenu.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.layout-container {
  min-height: 100%;
}

.app-header {
  background: var(--header-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--header-text);
  padding: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
  margin-right: 24px;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.theme-toggle {
  color: var(--header-text);
  padding: 8px;
  border-radius: 8px;
  transition: background-color var(--transition-base);
}

.theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.app-main {
  padding: 0;
  min-height: calc(100vh - 60px);
}

.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px 12px;
  }

  .app-header {
    height: auto !important;
  }

  .logo {
    font-size: 16px;
    margin-right: 8px;
  }
}
</style>
