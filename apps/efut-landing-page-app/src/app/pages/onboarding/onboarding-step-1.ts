import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '@libs/environment';
import { OnboardingApiService } from './onboarding-api.service';
import { RecaptchaService } from './recaptcha.service';

interface CountryPhoneOption {
  code: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
}

@Component({
  selector: 'app-onboarding-step-1',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './onboarding-step-1.html',
  styleUrl: './onboarding-step-1.scss',
})
export class OnboardingStep1Page {
  private readonly formBuilder = inject(FormBuilder);
  private readonly onboardingApiService = inject(OnboardingApiService);
  private readonly recaptchaService = inject(RecaptchaService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly humanVerificationSiteKey = environment.humanVerificationSiteKey;

  readonly countryOptions: CountryPhoneOption[] = [
    { code: '+55', flag: '🇧🇷', minDigits: 10, maxDigits: 11, placeholder: '(11) 99999-9999' },
    { code: '+1', flag: '🇺🇸', minDigits: 10, maxDigits: 10, placeholder: '(201) 555-0123' },
    { code: '+351', flag: '🇵🇹', minDigits: 9, maxDigits: 9, placeholder: '912 345 678' },
    { code: '+34', flag: '🇪🇸', minDigits: 9, maxDigits: 9, placeholder: '612 34 56 78' },
    { code: '+44', flag: '🇬🇧', minDigits: 10, maxDigits: 10, placeholder: '7400 123456' },
  ];

  readonly step1Form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    whatsappCountryCode: ['+55', [Validators.required]],
    whatsapp: ['', [Validators.required, Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
  });

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly success = signal(false);
  readonly generalError = signal<string | null>(null);
  readonly apiFieldErrors = signal<Record<string, string>>({});
  readonly humanVerificationError = signal<string | null>(null);

  constructor() {
    void this.initHumanVerification();
  }

  submit(): void {
    this.submitted.set(true);
    this.generalError.set(null);
    this.apiFieldErrors.set({});
    this.humanVerificationError.set(null);
    this.validateWhatsappByCountry();

    if (this.step1Form.invalid || this.isSubmitting()) {
      this.step1Form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    void this.recaptchaService
      .execute(this.humanVerificationSiteKey, 'onboarding_step1_submit')
      .then((token) => {
        this.onboardingApiService
          .submitStep1({
            firstName: this.step1Form.controls.firstName.value,
            lastName: this.step1Form.controls.lastName.value,
            whatsapp: this.buildWhatsappValue(),
            email: this.step1Form.controls.email.value,
            humanVerificationToken: token,
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.success.set(true);
              this.isSubmitting.set(false);
              this.step1Form.reset({
                firstName: '',
                lastName: '',
                whatsappCountryCode: '+55',
                whatsapp: '',
                email: '',
              });
            },
            error: (error: unknown) => {
              const normalizedError = this.onboardingApiService.normalizeApiError(error);
              const fieldErrors = { ...normalizedError.fieldErrors };

              if (fieldErrors['humanVerificationToken']) {
                this.humanVerificationError.set(fieldErrors['humanVerificationToken']);
                delete fieldErrors['humanVerificationToken'];
              }

              if ([400, 401, 403].includes(normalizedError.status)) {
                this.humanVerificationError.set('Falha na verificacao humana. Tente novamente.');
              }

              if (normalizedError.status === 503) {
                this.humanVerificationError.set(
                  'Servico de verificacao temporariamente indisponivel. Tente novamente em instantes.'
                );
              }

              this.apiFieldErrors.set(fieldErrors);
              this.generalError.set(this.getStep1ErrorMessage(normalizedError.status, normalizedError.message));
              this.isSubmitting.set(false);
            },
          });
      })
      .catch(() => {
        this.humanVerificationError.set('Nao foi possivel validar reCAPTCHA v3. Tente novamente.');
        this.isSubmitting.set(false);
      });
  }

  fieldError(fieldName: string): string | null {
    const backendError = this.apiFieldErrors()[fieldName];
    if (backendError) {
      return backendError;
    }

    if (fieldName === 'whatsapp') {
      const countryCodeControl = this.step1Form.controls.whatsappCountryCode;
      const whatsappControl = this.step1Form.controls.whatsapp;
      const touched = this.submitted() || countryCodeControl.touched || whatsappControl.touched;

      if (!touched) {
        return null;
      }

      if (countryCodeControl.hasError('required') || whatsappControl.hasError('required')) {
        return 'Campo obrigatorio.';
      }

      if (whatsappControl.hasError('maxlength')) {
        return 'Valor acima do limite permitido.';
      }

      if (whatsappControl.hasError('invalidPhone')) {
        return 'Numero invalido para o pais selecionado.';
      }

      return null;
    }

    const control = this.step1Form.controls[fieldName as keyof typeof this.step1Form.controls];
    if (!control || !(control.touched || this.submitted())) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Campo obrigatorio.';
    }

    if (control.hasError('email')) {
      return 'Informe um e-mail valido.';
    }

    if (control.hasError('maxlength')) {
      return 'Valor acima do limite permitido.';
    }

    return null;
  }

  onWhatsappInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = this.onlyDigits(input.value);
    const code = this.step1Form.controls.whatsappCountryCode.value;
    const masked = this.applyWhatsappMask(digits, code);

    this.step1Form.controls.whatsapp.setValue(masked, { emitEvent: false });
    this.validateWhatsappByCountry();
    input.value = masked;
  }

  onWhatsappCountryCodeChange(): void {
    const digits = this.onlyDigits(this.step1Form.controls.whatsapp.value);
    this.step1Form.controls.whatsapp.setValue(
      this.applyWhatsappMask(digits, this.step1Form.controls.whatsappCountryCode.value),
      { emitEvent: false }
    );
    this.validateWhatsappByCountry();
  }

  currentPhonePlaceholder(): string {
    return this.selectedCountryOption().placeholder;
  }

  private async initHumanVerification(): Promise<void> {
    if (!this.humanVerificationSiteKey || this.humanVerificationSiteKey.includes('REPLACE_')) {
      this.humanVerificationError.set('reCAPTCHA v3 nao configurado para este ambiente.');
      return;
    }

    try {
      await this.recaptchaService.loadApi(this.humanVerificationSiteKey);
      this.humanVerificationError.set(null);
    } catch {
      this.humanVerificationError.set('Nao foi possivel carregar reCAPTCHA v3.');
    }
  }

  private getStep1ErrorMessage(status: number, fallbackMessage: string): string {
    if (status === 500) {
      return 'Erro interno. Tente novamente em instantes.';
    }

    return fallbackMessage;
  }

  private buildWhatsappValue(): string {
    const countryCode = this.step1Form.controls.whatsappCountryCode.value;
    const localDigits = this.onlyDigits(this.step1Form.controls.whatsapp.value);
    return `${countryCode}${localDigits}`;
  }

  private onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
  }

  private applyWhatsappMask(digits: string, countryCode: string): string {
    if (countryCode === '+55') {
      const d = digits.slice(0, this.selectedCountryOption().maxDigits);

      if (d.length <= 2) {
        return d;
      }

      if (d.length <= 7) {
        return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      }

      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }

    if (countryCode === '+1') {
      const d = digits.slice(0, this.selectedCountryOption().maxDigits);

      if (d.length <= 3) {
        return d;
      }

      if (d.length <= 6) {
        return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      }

      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    }

    const d = digits.slice(0, this.selectedCountryOption().maxDigits);

    if (d.length <= 4) {
      return d;
    }

    if (d.length <= 8) {
      return `${d.slice(0, 4)} ${d.slice(4)}`;
    }

    return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
  }

  private validateWhatsappByCountry(): void {
    const control = this.step1Form.controls.whatsapp;
    const digitsCount = this.onlyDigits(control.value).length;
    const country = this.selectedCountryOption();

    if (!digitsCount) {
      this.clearControlError(control, 'invalidPhone');
      return;
    }

    const hasInvalidLength = digitsCount < country.minDigits || digitsCount > country.maxDigits;

    if (hasInvalidLength) {
      this.addControlError(control, 'invalidPhone');
      return;
    }

    this.clearControlError(control, 'invalidPhone');
  }

  private selectedCountryOption(): CountryPhoneOption {
    const code = this.step1Form.controls.whatsappCountryCode.value;
    return this.countryOptions.find((item) => item.code === code) ?? this.countryOptions[0];
  }

  private addControlError(
    control: { errors: Record<string, boolean> | null; setErrors: (errors: Record<string, boolean> | null) => void },
    errorKey: string
  ): void {
    control.setErrors({
      ...(control.errors ?? {}),
      [errorKey]: true,
    });
  }

  private clearControlError(
    control: { errors: Record<string, boolean> | null; setErrors: (errors: Record<string, boolean> | null) => void },
    errorKey: string
  ): void {
    if (!control.errors?.[errorKey]) {
      return;
    }

    const nextErrors = { ...control.errors };
    delete nextErrors[errorKey];
    control.setErrors(Object.keys(nextErrors).length > 0 ? nextErrors : null);
  }
}
