import { reactive, readonly } from 'vue'

const STORAGE_KEY = 'webtool-theme'

function getInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null
  if (stored) return stored
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

const state = reactive({
  theme: getInitialTheme(),
})

function applyTheme() {
  document.documentElement.classList.toggle('dark', state.theme === 'dark')
  localStorage.setItem(STORAGE_KEY, state.theme)
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light'
  applyTheme()
}

function setTheme(t: 'light' | 'dark') {
  state.theme = t
  applyTheme()
}

// Apply on import (handles initial load)
applyTheme()

// Listen for OS preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    state.theme = e.matches ? 'dark' : 'light'
    applyTheme()
  }
})

export const useThemeStore = () => ({
  theme: readonly(state),
  toggleTheme,
  setTheme,
})
