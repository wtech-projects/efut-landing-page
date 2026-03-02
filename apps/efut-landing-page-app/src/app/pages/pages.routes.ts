import { Routes } from '@angular/router';
import { HomePage } from './home/home';

export const genaiPagesRoutes: Routes = [
  {
    path: '',
    component: HomePage
  }, {
    path: 'blog',
    loadChildren: () => import('./blog/blog.routes').then((m) => m.blogRoutes)
  }, {
    path: 'onboarding',
    loadChildren: () => import('./onboarding/onboarding.routes').then((m) => m.onboardingRoutes)
  }, {
    path: 'profile',
    loadChildren: () => import('@libs/profile').then(m => m.profileRoutes)
  }
];
