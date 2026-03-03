import { Routes } from '@angular/router';
import { OnboardingStep1Page } from './onboarding-step-1';
import { OnboardingStep2Page } from './onboarding-step-2';

export const onboardingRoutes: Routes = [
  {
    path: '',
    component: OnboardingStep1Page,
  },
  {
    path: 'continue',
    redirectTo: 'continuar',
    pathMatch: 'full',
  },
  {
    path: 'continuar',
    component: OnboardingStep2Page,
  },
];
