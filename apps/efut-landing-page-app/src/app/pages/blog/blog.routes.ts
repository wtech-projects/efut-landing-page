import { Routes } from '@angular/router';
import { BlogPage } from './blog';
import { BlogPostPage } from './blog-post';

export const blogRoutes: Routes = [
  {
    path: '',
    component: BlogPage
  },
  {
    path: ':slug',
    component: BlogPostPage
  }
];
