import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OnboardingApiService } from './onboarding-api.service';

@Component({
  selector: 'app-onboarding-step-2',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './onboarding-step-2.html',
  styleUrl: './onboarding-step-2.scss',
})
export class OnboardingStep2Page {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly onboardingApiService = inject(OnboardingApiService);

  readonly maxLogoSizeBytes = 5 * 1024 * 1024;
  readonly allowedLogoTypes = ['image/png', 'image/jpeg'];

  readonly token = computed(() => this.route.snapshot.queryParamMap.get('token') ?? '');
  readonly hasToken = computed(() => this.token().trim().length > 0);

  readonly step2Form = this.formBuilder.nonNullable.group({
    leagueName: ['', [Validators.required, Validators.maxLength(100)]],
    adminLogin: ['', [Validators.required, Validators.maxLength(60)]],
    adminPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]],
    logo: [null as File | null, [Validators.required]],
  });

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly success = signal(false);
  readonly generalError = signal<string | null>(null);
  readonly apiFieldErrors = signal<Record<string, string>>({});

  submit(): void {
    this.submitted.set(true);
    this.generalError.set(null);
    this.apiFieldErrors.set({});

    if (!this.hasToken()) {
      this.generalError.set('Link invalido. Inicie novamente em Criar liga.');
      return;
    }

    if (this.step2Form.invalid || this.isSubmitting()) {
      this.step2Form.markAllAsTouched();
      return;
    }

    const logo = this.step2Form.controls.logo.value;

    if (!logo) {
      this.step2Form.controls.logo.setErrors({ required: true });
      return;
    }

    this.isSubmitting.set(true);

    this.onboardingApiService
      .submitStep2({
        token: this.token(),
        leagueName: this.step2Form.controls.leagueName.value,
        adminLogin: this.step2Form.controls.adminLogin.value,
        adminPassword: this.step2Form.controls.adminPassword.value,
        logo,
      })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.success.set(true);
          this.isSubmitting.set(false);
          this.step2Form.reset();
        },
        error: (error: unknown) => {
          const normalizedError = this.onboardingApiService.normalizeApiError(error);
          const fieldErrors = { ...normalizedError.fieldErrors };

          if (normalizedError.status === 409 && !fieldErrors['leagueName']) {
            fieldErrors['leagueName'] = 'Nome de liga ja esta em uso.';
          }

          this.apiFieldErrors.set(fieldErrors);
          this.generalError.set(this.getStep2ErrorMessage(normalizedError.status, normalizedError.message));
          this.isSubmitting.set(false);
        },
      });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    this.step2Form.controls.logo.setValue(null);
    this.apiFieldErrors.update((current) => {
      const next = { ...current };
      delete next['logo'];
      return next;
    });

    if (!file) {
      this.step2Form.controls.logo.setErrors({ required: true });
      return;
    }

    if (!this.allowedLogoTypes.includes(file.type)) {
      this.step2Form.controls.logo.setErrors({ fileType: true });
      return;
    }

    if (file.size > this.maxLogoSizeBytes) {
      this.step2Form.controls.logo.setErrors({ maxSize: true });
      return;
    }

    this.step2Form.controls.logo.setValue(file);
    this.step2Form.controls.logo.setErrors(null);
  }

  fieldError(fieldName: string): string | null {
    const backendError = this.apiFieldErrors()[fieldName];
    if (backendError) {
      return backendError;
    }

    const control = this.step2Form.controls[fieldName as keyof typeof this.step2Form.controls];

    if (!control || !(control.touched || this.submitted())) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Campo obrigatorio.';
    }

    if (control.hasError('minlength')) {
      return 'Informe pelo menos 8 caracteres.';
    }

    if (control.hasError('maxlength')) {
      return 'Valor acima do limite permitido.';
    }

    if (control.hasError('fileType')) {
      return 'Formato invalido. Use PNG ou JPEG.';
    }

    if (control.hasError('maxSize')) {
      return 'Arquivo acima de 5MB.';
    }

    return null;
  }

  private getStep2ErrorMessage(status: number, fallbackMessage: string): string {
    if (status === 404) {
      return 'Token nao encontrado. Inicie novamente em Criar liga.';
    }

    if (status === 500) {
      return 'Erro interno. Tente novamente em instantes.';
    }

    if (status === 409) {
      return 'Nao foi possivel concluir. Revise o nome da liga e tente novamente.';
    }

    if (status === 400 && fallbackMessage.toLowerCase().includes('token')) {
      return 'Seu link expirou. Inicie novamente em Criar liga.';
    }

    return fallbackMessage;
  }
}
