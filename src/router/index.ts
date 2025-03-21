import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'


const routerInfo = {
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes
};

const router = createRouter(routerInfo);


export default router



