export const routes = [
  {
    path: '/approximation',
    name: 'Аппроксимация',
    component: () => import('@/pages/approximation/index.vue')  // Обратите внимание на () =>
  },
  {
    path: '/chart',
    name: 'График',
    component: () => import('@/pages/chart/index.vue')  // Обратите внимание на () =>
  },
  {
    path: '/settings',
    name: 'Настройки',
    component: () => import('@/pages/settings/index.vue')  // Обратите внимание на () =>
  },
]
