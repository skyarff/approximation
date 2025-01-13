import approximation from '@/pages/approximation/index.vue'
import modeling from '@/pages/modeling/index.vue'
import graphics from '@/pages/graphics/index.vue'


export const routes = [
    {
      path: '/approximation',
      name: 'Аппроксимация',
      component: approximation
    },
    {
      path: '/graphics',
      name: 'Графики',
      component: graphics
    },
    {
      path: '/modeling',
      name: 'Моделирование',
      component: modeling
    },
  ]
