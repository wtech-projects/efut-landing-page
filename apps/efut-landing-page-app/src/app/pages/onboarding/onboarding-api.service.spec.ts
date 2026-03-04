import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OnboardingApiService } from './onboarding-api.service';

describe('OnboardingApiService', () => {
  let service: OnboardingApiService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(OnboardingApiService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('posts step 1 payload to onboarding v1 endpoint', () => {
    service
      .submitStep1({
        firstName: 'Ana',
        lastName: 'Silva',
        whatsapp: '+5511999999999',
        email: 'ana@email.com',
        humanVerificationToken: 'verification-token',
      })
      .subscribe();

    const req = httpController.expectOne('http://localhost:8080/api/v1/onboarding/step-1');

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      firstName: 'Ana',
      lastName: 'Silva',
      whatsapp: '+5511999999999',
      email: 'ana@email.com',
      humanVerificationToken: 'verification-token',
    });

    req.flush({});
  });

  it('posts step 2 payload as multipart form data', () => {
    const logo = new File(['logo-content'], 'logo.png', { type: 'image/png' });

    service
      .submitStep2({
        token: 'token-123',
        leagueName: 'Liga Pro',
        state: 'SP',
        adminLogin: 'admin',
        adminPassword: '12345678',
        logo,
      })
      .subscribe();

    const req = httpController.expectOne('http://localhost:8080/api/v1/onboarding/step-2');

    expect(req.request.method).toBe('POST');
    expect(req.request.body.get('token')).toBe('token-123');
    expect(req.request.body.get('leagueName')).toBe('Liga Pro');
    expect(req.request.body.get('state')).toBe('SP');
    expect(req.request.body.get('adminLogin')).toBe('admin');
    expect(req.request.body.get('adminPassword')).toBe('12345678');

    req.flush({});
  });

  it('posts logo for pre-validation endpoint', () => {
    const logo = new File(['logo-content'], 'logo.png', { type: 'image/png' });

    service.validateStep2Logo(logo).subscribe();

    const req = httpController.expectOne('http://localhost:8080/api/v1/onboarding/step-2/logo-validation');

    expect(req.request.method).toBe('POST');
    expect(req.request.body.get('logo')).toBe(logo);

    req.flush({
      valid: true,
      width: 512,
      height: 512,
      hasTransparency: true,
    });
  });

  it('posts normalized league name for pre-validation endpoint', () => {
    service
      .validateStep2LeagueName({
        leagueNameNormalized: 'liga-elite',
      })
      .subscribe();

    const req = httpController.expectOne('http://localhost:8080/api/v1/onboarding/step-2/league-name-validation');

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      leagueNameNormalized: 'liga-elite',
    });

    req.flush({
      available: true,
      message: 'Nome da liga disponível',
    });
  });
});
