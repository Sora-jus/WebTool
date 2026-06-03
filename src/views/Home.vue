<template>
  <div class="home-container">
    <div class="hero">
      <h1>在线开发工具集</h1>
      <p class="hero-subtitle">简洁 · 高效 · 即开即用</p>
    </div>

    <el-row :gutter="24">
      <el-col
        v-for="tool in tools"
        :key="tool.path"
        :xs="24"
        :sm="12"
        :md="8"
      >
        <el-card
          class="tool-card"
          shadow="hover"
          @click="router.push(tool.path)"
        >
          <div class="card-icon">
            <component :is="tool.icon" :size="48" />
          </div>
          <h2 class="card-title">{{ tool.title }}</h2>
          <p class="card-desc">{{ tool.description }}</p>
          <el-button type="primary" class="card-action">
            进入 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DocumentChecked, EditPen, Brush, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()

const tools = [
  {
    path: '/json-formatter',
    title: 'JSON 格式化',
    description: '快速格式化、压缩、校验 JSON 数据',
    icon: DocumentChecked,
  },
  {
    path: '/markdown-editor',
    title: 'Markdown 编辑',
    description: '实时预览 Markdown，支持代码高亮',
    icon: EditPen,
  },
  {
    path: '/code-studio',
    title: '样式调制',
    description: '在线编写 HTML/CSS/JS，即时预览效果',
    icon: Brush,
  },
]
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
}

.hero {
  text-align: center;
  margin-bottom: 56px;
}

.hero h1 {
  font-size: 40px;
  font-weight: 700;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
}

.hero-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0;
}

.tool-card {
  cursor: pointer;
  transition: all var(--transition-base);
  border: var(--card-border);
  border-radius: 12px;
  height: 100%;
  text-align: center;
  padding: 8px 0;
  background: var(--bg-card);
}

.tool-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--card-hover-shadow);
  border-color: var(--card-border-hover);
}

.card-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  color: #409eff;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.card-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.6;
}

.card-action {
  min-width: 120px;
}

:deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (max-width: 768px) {
  .home-container {
    padding: 32px 16px;
  }

  .hero {
    margin-bottom: 36px;
  }

  .hero h1 {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 15px;
  }
}
</style>
