import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

type TypeRouter = {
  history: any,
  routes: any,
  [key: string]: any
}


const routerInfo: TypeRouter = {
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes
};

const router = createRouter(routerInfo);


export default router



