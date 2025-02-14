export const routes = [
    {
      path: '/approximation',
      name: 'Аппроксимация',
      component: import('@/pages/approximation/index.vue')
    },
    {
      path: '/chart',
      name: 'График',
      component: import('@/pages/chart/index.vue')
    },
    {
      path: '/settings',
      name: 'Настройки',
      component: import('@/pages/settings/index.vue')
    },
    // {
    //   path: '/settings',
    //   name: 'Помощь',
    //   component: import('@/pages/settings/index.vue')
    // },
  ]
