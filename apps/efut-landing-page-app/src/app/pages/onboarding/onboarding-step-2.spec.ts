import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { fakeAsync, tick } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { of, Subject, throwError } from 'rxjs';
import { OnboardingApiService } from './onboarding-api.service';
import { OnboardingStep2Page } from './onboarding-step-2';
import { OnboardingLogoValidationResult } from './onboarding.types';

describe('OnboardingStep2Page', () => {
  let spectator: Spectator<OnboardingStep2Page>;

  const onboardingApiMock = {
    submitStep2: jasmine.createSpy('submitStep2').and.returnValue(of(void 0)),
    validateStep2Logo: jasmine.createSpy('validateStep2Logo').and.returnValue(
      of({
        valid: true,
        width: 256,
        height: 256,
        hasTransparency: true,
      })
    ),
    validateStep2LeagueName: jasmine.createSpy('validateStep2LeagueName').and.returnValue(
      of({
        available: true,
        message: 'Nome da liga disponível',
      })
    ),
    normalizeApiError: jasmine.createSpy('normalizeApiError').and.callFake(() => ({
      status: 0,
      message: 'erro',
      fieldErrors: {},
    })),
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

  beforeEach(() => {
    onboardingApiMock.submitStep2.calls.reset();
    onboardingApiMock.validateStep2Logo.calls.reset();
    onboardingApiMock.validateStep2Logo.and.returnValue(
      of({
        valid: true,
        width: 256,
        height: 256,
        hasTransparency: true,
      })
    );
    onboardingApiMock.validateStep2LeagueName.calls.reset();
    onboardingApiMock.validateStep2LeagueName.and.returnValue(
      of({
        available: true,
        message: 'Nome da liga disponível',
      })
    );
    onboardingApiMock.normalizeApiError.calls.reset();
    onboardingApiMock.normalizeApiError.and.callFake(() => ({
      status: 0,
      message: 'erro',
      fieldErrors: {},
    }));
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

    expect(spectator.query('h2')?.textContent).toContain('Link inválido');
  });

  it('generates dominio automatically from league name in lowercase format', () => {
    spectator = createComponent();

    spectator.component.step2Form.controls.leagueName.setValue('Liga Sao Paulo 2026');

    expect(spectator.component.leagueDomainPreview()).toBe('https://ligasaopaulo2026.gramadosvirtuais.com');
  });

  it('debounces league-name validation and sends normalized payload', fakeAsync(() => {
    spectator = createComponent();

    spectator.component.step2Form.controls.leagueName.setValue('Liga Elite');
    tick(450);

    expect(onboardingApiMock.validateStep2LeagueName).toHaveBeenCalledWith({
      leagueNameNormalized: 'liga-elite',
    });
    expect(spectator.component.leagueNameValidationState()).toBe('available');
    expect(spectator.component.leagueNameValidationMessage()).toBe('Nome da liga disponível');
  }));

  it('marks league-name as unavailable when backend says unavailable', fakeAsync(() => {
    spectator = createComponent();
    onboardingApiMock.validateStep2LeagueName.and.returnValue(
      of({
        available: false,
        message: 'Nome da liga indisponível',
      })
    );

    spectator.component.step2Form.controls.leagueName.setValue('Liga Existente');
    tick(450);

    expect(spectator.component.leagueNameValidationState()).toBe('unavailable');
    expect(spectator.component.leagueNameValidationMessage()).toBe('Nome da liga indisponível');
  }));

  it('marks league-name validation as error when API fails', fakeAsync(() => {
    spectator = createComponent();
    onboardingApiMock.validateStep2LeagueName.and.returnValue(
      throwError(() => ({
        mocked: true,
      }))
    );

    spectator.component.step2Form.controls.leagueName.setValue('Liga Nova');
    tick(450);

    expect(spectator.component.leagueNameValidationState()).toBe('error');
    expect(spectator.component.leagueNameValidationMessage()).toContain('Não foi possível validar');
  }));

  it('marks low robustness password as invalid', () => {
    spectator = createComponent();

    spectator.component.step2Form.controls.adminPassword.setValue('aaaaaaaa');

    expect(spectator.component.step2Form.controls.adminPassword.hasError('weakPassword')).toBeTrue();
    expect(spectator.component.passwordStrength().level).toBe('low');
    expect(spectator.component.fieldError('adminPassword')).toBeNull();
  });

  it('accepts medium or high robustness password', () => {
    spectator = createComponent();

    spectator.component.step2Form.controls.adminPassword.setValue('Senha123');

    expect(spectator.component.step2Form.controls.adminPassword.hasError('weakPassword')).toBeFalse();
    expect(spectator.component.passwordStrength().level).toBe('medium');
  });

  it('marks confirmation as invalid when passwords do not match', () => {
    spectator = createComponent();

    spectator.component.step2Form.controls.adminPassword.setValue('Senha123!');
    spectator.component.step2Form.controls.confirmAdminPassword.setValue('Senha1234!');
    spectator.component.step2Form.controls.confirmAdminPassword.markAsTouched();

    expect(spectator.component.step2Form.controls.confirmAdminPassword.hasError('passwordMismatch')).toBeTrue();
    expect(spectator.component.fieldError('confirmAdminPassword')).toBe('As senhas precisam ser iguais.');
  });

  it('accepts confirmation when passwords match', () => {
    spectator = createComponent();

    spectator.component.step2Form.controls.adminPassword.setValue('Senha123!');
    spectator.component.step2Form.controls.confirmAdminPassword.setValue('Senha123!');

    expect(spectator.component.step2Form.controls.confirmAdminPassword.hasError('passwordMismatch')).toBeFalse();
  });

  it('validates selected logo file with backend endpoint', () => {
    spectator = createComponent();

    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    spectator.component.onLogoSelected({
      target: {
        files: {
          item: () => file,
        },
      },
    } as unknown as Event);

    expect(onboardingApiMock.validateStep2Logo).toHaveBeenCalledWith(file);
    expect(spectator.component.logoValidationState()).toBe('valid');
    expect(spectator.component.fieldError('logo')).toBeNull();
  });

  it('shows backend validation error and keeps logo invalid', () => {
    spectator = createComponent();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    onboardingApiMock.validateStep2Logo.and.returnValue(
      throwError(() => ({
        mocked: true,
      }))
    );
    onboardingApiMock.normalizeApiError.and.returnValue({
      status: 400,
      message: 'Logo precisa ter fundo transparente.',
      fieldErrors: {},
    });

    spectator.component.onLogoSelected({
      target: {
        files: {
          item: () => file,
        },
      },
    } as unknown as Event);

    expect(spectator.component.logoValidationState()).toBe('invalid');
    expect(spectator.component.fieldError('logo')).toBe('Logo precisa ter fundo transparente.');
  });

  it('shows generic message when logo validation fails by network error', () => {
    spectator = createComponent();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    onboardingApiMock.validateStep2Logo.and.returnValue(
      throwError(() => ({
        mocked: true,
      }))
    );
    onboardingApiMock.normalizeApiError.and.returnValue({
      status: 0,
      message: 'erro',
      fieldErrors: {},
    });

    spectator.component.onLogoSelected({
      target: {
        files: {
          item: () => file,
        },
      },
    } as unknown as Event);

    expect(spectator.component.logoValidationState()).toBe('invalid');
    expect(spectator.component.fieldError('logo')).toBe(
      'Não foi possível validar o logo agora. Selecione o arquivo novamente.'
    );
  });

  it('prevents duplicate validation request for same file while in-flight', () => {
    spectator = createComponent();
    const pending = new Subject<OnboardingLogoValidationResult>();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    onboardingApiMock.validateStep2Logo.and.returnValue(pending);

    spectator.component.onLogoSelected({
      target: {
        files: {
          item: () => file,
        },
      },
    } as unknown as Event);

    spectator.component.onLogoSelected({
      target: {
        files: {
          item: () => file,
        },
      },
    } as unknown as Event);

    expect(onboardingApiMock.validateStep2Logo).toHaveBeenCalledTimes(1);
  });

  it('resets logo validation state when file is removed', () => {
    spectator = createComponent();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    spectator.component.onLogoSelected({
      target: {
        files: {
          item: () => file,
        },
      },
    } as unknown as Event);

    spectator.component.onLogoSelected({
      target: {
        files: {
          item: () => null,
        },
      },
    } as unknown as Event);

    expect(spectator.component.logoValidationState()).toBe('idle');
    expect(spectator.component.step2Form.controls.logo.hasError('required')).toBeTrue();
    expect(spectator.component.fieldError('logo')).toBeNull();
  });

  it('blocks submit while logo is not validated', () => {
    spectator = createComponent();
    spectator.component.leagueNameValidationState.set('available');

    spectator.component.step2Form.patchValue({
      leagueName: 'Liga X',
      state: 'SP',
      adminLogin: 'admin',
      adminPassword: 'Senha123!',
      confirmAdminPassword: 'Senha123!',
      logo: new File(['logo'], 'logo.png', { type: 'image/png' }),
    });

    spectator.component.submit();

    expect(onboardingApiMock.submitStep2).not.toHaveBeenCalled();
    expect(spectator.component.fieldError('logo')).toBe('Selecione e valide um logo antes de continuar.');
  });

  it('blocks submit while league name is not available', () => {
    spectator = createComponent();
    spectator.component.leagueNameValidationState.set('unavailable');
    spectator.component.logoValidationState.set('valid');

    spectator.component.step2Form.patchValue({
      leagueName: 'Liga X',
      state: 'SP',
      adminLogin: 'admin',
      adminPassword: 'Senha123!',
      confirmAdminPassword: 'Senha123!',
      logo: new File(['logo'], 'logo.png', { type: 'image/png' }),
    });

    spectator.component.submit();

    expect(onboardingApiMock.submitStep2).not.toHaveBeenCalled();
    expect(spectator.component.leagueNameValidationMessage()).toBe('Valide um nome de liga disponível antes de continuar.');
  });
});
