type TypeRoute = {
  path: string,
  name: string,
  component: () => any,
  [key: string]: any
}

export const routes: TypeRoute[] = [
  {
    path: '/approximation',
    name: 'Аппроксимация',
    component: () => import('@/pages/approximation/index.vue')
  },
  {
    path: '/chart2D',
    name: 'График 2D',
    component: () => import('@/pages/chart2D/index.vue')
  },
  {
    path: '/chart3D',
    name: 'График 3D',
    component: () => import('@/pages/chart3D/index.vue')
  },
  {
    path: '/settings',
    name: 'Настройки',
    component: () => import('@/pages/settings/index.vue')
  },
]
