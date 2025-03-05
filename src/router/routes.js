export const routes = [
  {
    path: '/approximation',
    name: 'Аппроксимация',
    component: () => import('@/pages/approximation/index.vue')  // Обратите внимание на () =>
  },
  {
    path: '/chart2D',
    name: '2d графика',
    component: () => import('@/pages/chart2D/index.vue')  // Обратите внимание на () =>
  },
  {
    path: '/chart3D',
    name: '3d графика',
    component: () => import('@/pages/chart3D/index.vue')  // Обратите внимание на () =>
  },
  {
    path: '/settings',
    name: 'Настройки',
    component: () => import('@/pages/settings/index.vue')  // Обратите внимание на () =>
  },
]
