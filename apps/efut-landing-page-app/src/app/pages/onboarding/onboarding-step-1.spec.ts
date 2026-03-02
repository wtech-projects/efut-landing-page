import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import { OnboardingApiService } from './onboarding-api.service';
import { OnboardingStep1Page } from './onboarding-step-1';
import { RecaptchaService } from './recaptcha.service';

describe('OnboardingStep1Page', () => {
  let spectator: Spectator<OnboardingStep1Page>;
  let executeCalls = 0;
  let submitPayload: Record<string, string> | null = null;
  let submitStep1ResponseFactory: () => Observable<unknown>;

  const onboardingApiMock = {
    submitStep1: (payload: Record<string, string>) => {
      submitPayload = payload;
      return submitStep1ResponseFactory();
    },
    normalizeApiError: (error: unknown) => error as {
      status: number;
      message: string;
      fieldErrors: Record<string, string>;
    },
  };

  const recaptchaServiceMock = {
    loadApi: () => Promise.resolve(),
    execute: () => {
      executeCalls += 1;
      return Promise.resolve('v3-token');
    },
  };

  const createComponent = createComponentFactory({
    component: OnboardingStep1Page,
    providers: [
      {
        provide: OnboardingApiService,
        useValue: onboardingApiMock,
      },
      {
        provide: RecaptchaService,
        useValue: recaptchaServiceMock,
      },
    ],
  });

  beforeEach(() => {
    executeCalls = 0;
    submitPayload = null;
    submitStep1ResponseFactory = () => of(void 0);
    spectator = createComponent();
  });

  it('includes humanVerificationToken in step 1 payload', async () => {
    spectator.component.step1Form.setValue({
      firstName: 'Ana',
      lastName: 'Silva',
      whatsappCountryCode: '+55',
      whatsapp: '(11) 99999-9999',
      email: 'ana@email.com',
    });

    spectator.component.submit();
    await Promise.resolve();

    expect(executeCalls).toBe(1);
    expect(submitPayload).toEqual({
      firstName: 'Ana',
      lastName: 'Silva',
      whatsapp: '+5511999999999',
      email: 'ana@email.com',
      humanVerificationToken: 'v3-token',
    });
  });

  it('shows human verification error on backend 400 field error', async () => {
    submitStep1ResponseFactory = () =>
      throwError(() => ({
        status: 400,
        message: 'Validation failed',
        fieldErrors: {
          humanVerificationToken: 'Falha na verificacao humana. Tente novamente.',
        },
      }));

    spectator.component.step1Form.setValue({
      firstName: 'Ana',
      lastName: 'Silva',
      whatsappCountryCode: '+55',
      whatsapp: '(11) 99999-9999',
      email: 'ana@email.com',
    });

    spectator.component.submit();
    await Promise.resolve();

    expect(spectator.component.humanVerificationError()).toBe('Falha na verificacao humana. Tente novamente.');
    expect(spectator.component.isSubmitting()).toBe(false);
  });

  it('shows temporary unavailable message on backend 503', async () => {
    submitStep1ResponseFactory = () =>
      throwError(() => ({
        status: 503,
        message: 'Human verification service unavailable',
        fieldErrors: {},
      }));

    spectator.component.step1Form.setValue({
      firstName: 'Ana',
      lastName: 'Silva',
      whatsappCountryCode: '+55',
      whatsapp: '(11) 99999-9999',
      email: 'ana@email.com',
    });

    spectator.component.submit();
    await Promise.resolve();

    expect(spectator.component.humanVerificationError()).toBe(
      'Servico de verificacao temporariamente indisponivel. Tente novamente em instantes.'
    );
    expect(spectator.component.isSubmitting()).toBe(false);
  });

  it('does not call API when recaptcha token generation fails', async () => {
    const originalExecute = recaptchaServiceMock.execute;
    recaptchaServiceMock.execute = () => Promise.reject(new Error('recaptcha-failed'));

    spectator.component.step1Form.setValue({
      firstName: 'Ana',
      lastName: 'Silva',
      whatsappCountryCode: '+55',
      whatsapp: '(11) 99999-9999',
      email: 'ana@email.com',
    });

    spectator.component.submit();
    await Promise.resolve();

    expect(submitPayload).toBeNull();
    expect(spectator.component.humanVerificationError()).toBe('Nao foi possivel validar reCAPTCHA v3. Tente novamente.');
    expect(spectator.component.isSubmitting()).toBe(false);

    recaptchaServiceMock.execute = originalExecute;
  });
});
