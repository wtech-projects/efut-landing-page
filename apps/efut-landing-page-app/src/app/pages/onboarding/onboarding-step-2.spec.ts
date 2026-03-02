import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { of } from 'rxjs';
import { OnboardingApiService } from './onboarding-api.service';
import { OnboardingStep2Page } from './onboarding-step-2';

describe('OnboardingStep2Page', () => {
  let spectator: Spectator<OnboardingStep2Page>;

  const onboardingApiMock = {
    submitStep2: () => of(void 0),
    normalizeApiError: () => ({
      status: 0,
      message: 'erro',
      fieldErrors: {},
    }),
  };

  const createComponent = createComponentFactory({
    component: OnboardingStep2Page,
    providers: [
      {
        provide: OnboardingApiService,
        useValue: onboardingApiMock,
      },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParamMap: convertToParamMap({ token: 'abc-123' }),
          },
        },
      },
    ],
  });

  it('shows restart guidance when token is missing', () => {
    spectator = createComponent({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    });

    expect(spectator.query('h2')?.textContent).toContain('Link invalido');
  });

  it('blocks unsupported logo file type', () => {
    spectator = createComponent();

    const txtFile = new File(['text'], 'logo.txt', { type: 'text/plain' });
    spectator.component.onLogoSelected({
      target: {
        files: {
          item: () => txtFile,
        },
      },
    } as unknown as Event);

    expect(spectator.component.fieldError('logo')).toBe('Formato invalido. Use PNG ou JPEG.');
  });
});
