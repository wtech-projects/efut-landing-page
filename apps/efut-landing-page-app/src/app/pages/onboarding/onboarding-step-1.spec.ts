import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { of } from 'rxjs';
import { OnboardingApiService } from './onboarding-api.service';
import { OnboardingStep1Page } from './onboarding-step-1';

describe('OnboardingStep1Page', () => {
  let spectator: Spectator<OnboardingStep1Page>;
  let submitCalls = 0;

  const onboardingApiMock = {
    submitStep1: () => {
      submitCalls += 1;
      return of(void 0);
    },
    normalizeApiError: () => ({
      status: 0,
      message: 'erro',
      fieldErrors: {},
    }),
  };

  const createComponent = createComponentFactory({
    component: OnboardingStep1Page,
    providers: [
      {
        provide: OnboardingApiService,
        useValue: onboardingApiMock,
      },
    ],
  });

  beforeEach(() => {
    submitCalls = 0;
    spectator = createComponent();
  });

  it('shows email validation error when invalid', () => {
    spectator.component.step1Form.controls.email.setValue('invalid-email');
    spectator.component.step1Form.controls.email.markAsTouched();

    expect(spectator.component.fieldError('email')).toBe('Informe um e-mail valido.');
  });

  it('submits valid payload and shows success state', () => {
    spectator.component.step1Form.setValue({
      firstName: 'Ana',
      lastName: 'Silva',
      whatsappCountryCode: '+55',
      whatsapp: '(11) 99999-9999',
      email: 'ana@email.com',
    });

    spectator.component.submit();

    expect(submitCalls).toBe(1);
    expect(spectator.component.success()).toBe(true);
  });
});
