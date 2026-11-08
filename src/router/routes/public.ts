import type { RouteRecordRaw } from 'vue-router'

export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'Home',
    component: () => import('@/views/public/landing/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/public/auth/LoginView.vue'),
    meta: { title: 'Admin login' },
  },
  {
    path: '/join/:code?',
    name: 'Join',
    component: () => import('@/views/public/quizzer/JoinView.vue'),
    meta: { title: 'Join a quiz' },
  },
  {
    path: '/play/:code',
    name: 'Play',
    component: () => import('@/views/public/quizzer/PlayView.vue'),
    meta: { title: 'Play', hideFooter: true },
  },
]
