import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, debounceTime, filter, map, of, startWith, switchMap, tap } from 'rxjs';
import { OnboardingApiService } from './onboarding-api.service';
import { PasswordStrengthIndicatorComponent } from './password-strength-indicator.component';
import { evaluatePasswordStrength } from './password-strength.util';

@Component({
  selector: 'app-onboarding-step-2',
  imports: [ReactiveFormsModule, RouterLink, PasswordStrengthIndicatorComponent],
  templateUrl: './onboarding-step-2.html',
  styleUrl: './onboarding-step-2.scss',
})
export class OnboardingStep2Page {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly onboardingApiService = inject(OnboardingApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly weakPasswordValidator: ValidatorFn = (control) => {
    const value = `${control.value ?? ''}`;
    if (!value) {
      return null;
    }

    const result = evaluatePasswordStrength(value);
    return result.level === 'low' ? { weakPassword: true } : null;
  };

  readonly token = computed(() => this.route.snapshot.queryParamMap.get('token') ?? '');
  readonly hasToken = computed(() => this.token().trim().length > 0);

  readonly step2Form = this.formBuilder.nonNullable.group({
    leagueName: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', [Validators.required]],
    adminLogin: ['', [Validators.required, Validators.maxLength(60)]],
    adminPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(120), this.weakPasswordValidator]],
    confirmAdminPassword: ['', [Validators.required, Validators.maxLength(120)]],
    logo: [null as File | null, [Validators.required]],
  });

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly success = signal(false);
  readonly generalError = signal<string | null>(null);
  readonly apiFieldErrors = signal<Record<string, string>>({});
  readonly logoValidationState = signal<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  readonly logoValidationMessage = signal<string | null>(null);
  readonly selectedLogoPreviewUrl = signal<string | null>(null);
  readonly leagueNameValidationState = signal<'idle' | 'validating' | 'available' | 'unavailable' | 'error'>('idle');
  readonly leagueNameValidationMessage = signal<string>('Digite o nome da liga para validar a disponibilidade.');
  readonly passwordStrength = signal(evaluatePasswordStrength(''));
  readonly domainProtocol = 'https://';
  readonly domainSuffix = '.gramadosvirtuais.com';
  readonly leagueDomainKey = signal('');
  readonly leagueDomainPreview = computed(
    () => `${this.domainProtocol}${this.leagueDomainKey() || 'sualiga'}${this.domainSuffix}`
  );
  readonly brazilStates = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];

  private readonly selectedLogoSignature = signal<string | null>(null);
  private readonly validatingLogoSignature = signal<string | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => this.clearLogoPreviewUrl());
    this.step2Form.controls.leagueName.valueChanges
      .pipe(
        startWith(this.step2Form.controls.leagueName.value),
        tap((leagueName) => {
          this.leagueDomainKey.set(this.toDomainKey(leagueName));
          this.apiFieldErrors.update((current) => {
            const next = { ...current };
            delete next['leagueName'];
            return next;
          });
          this.prepareLeagueNameValidation(leagueName);
        }),
        debounceTime(400),
        map((leagueName) => this.toLeagueNameNormalized(leagueName)),
        filter((normalized) => this.shouldValidateLeagueName(normalized)),
        switchMap((leagueNameNormalized) =>
          this.onboardingApiService.validateStep2LeagueName({ leagueNameNormalized }).pipe(
            map((response) => ({ response, error: null as null })),
            catchError((error: unknown) => of({ response: null, error }))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((leagueName) => {
        if (leagueName.error) {
          this.leagueNameValidationState.set('error');
          this.leagueNameValidationMessage.set(
            'Não foi possível validar o nome da liga agora. Continue digitando para tentar novamente.'
          );
          return;
        }

        const response = leagueName.response;
        if (!response) {
          this.leagueNameValidationState.set('error');
          this.leagueNameValidationMessage.set(
            'Não foi possível validar o nome da liga agora. Continue digitando para tentar novamente.'
          );
          return;
        }

        if (response.available) {
          this.leagueNameValidationState.set('available');
          this.leagueNameValidationMessage.set(response.message || 'Nome da liga disponível');
          return;
        }

        this.leagueNameValidationState.set('unavailable');
        this.leagueNameValidationMessage.set(response.message || 'Nome da liga indisponível');
      });

    this.step2Form.controls.adminPassword.valueChanges
      .pipe(startWith(this.step2Form.controls.adminPassword.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((password) => {
        this.passwordStrength.set(evaluatePasswordStrength(password));
        this.updatePasswordMatchState();
      });

    this.step2Form.controls.confirmAdminPassword.valueChanges
      .pipe(startWith(this.step2Form.controls.confirmAdminPassword.value), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updatePasswordMatchState();
      });
  }

  submit(): void {
    this.submitted.set(true);
    this.generalError.set(null);
    this.apiFieldErrors.set({});

    if (!this.hasToken()) {
      this.generalError.set('Link inválido. Inicie novamente em Criar liga.');
      return;
    }

    if (this.leagueNameValidationState() === 'validating') {
      this.leagueNameValidationState.set('error');
      this.leagueNameValidationMessage.set('Aguarde a validação do nome da liga.');
      return;
    }

    if (this.leagueNameValidationState() !== 'available') {
      this.leagueNameValidationState.set('error');
      this.leagueNameValidationMessage.set('Valide um nome de liga disponível antes de continuar.');
      return;
    }

    if (this.logoValidationState() === 'validating') {
      this.logoValidationState.set('invalid');
      this.logoValidationMessage.set('Aguarde a validação do logo.');
      return;
    }

    if (this.logoValidationState() !== 'valid') {
      this.logoValidationState.set('invalid');
      this.logoValidationMessage.set('Selecione e valide um logo antes de continuar.');
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
        state: this.step2Form.controls.state.value,
        adminLogin: this.step2Form.controls.adminLogin.value,
        adminPassword: this.step2Form.controls.adminPassword.value,
        logo,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
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
            fieldErrors['leagueName'] = 'Nome de liga já está em uso.';
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
    const nextSignature = file ? this.getLogoSignature(file) : null;

    if (
      this.logoValidationState() === 'validating' &&
      this.validatingLogoSignature() === nextSignature &&
      this.selectedLogoSignature() === nextSignature
    ) {
      return;
    }

    this.step2Form.controls.logo.setValue(null);
    this.clearLogoPreviewUrl();
    this.resetLogoValidationState();

    if (!file) {
      this.step2Form.controls.logo.setErrors({ required: true });
      return;
    }

    const fileSignature = this.getLogoSignature(file);
    this.step2Form.controls.logo.setValue(file);
    this.step2Form.controls.logo.setErrors(null);
    this.selectedLogoPreviewUrl.set(URL.createObjectURL(file));
    this.selectedLogoSignature.set(fileSignature);
    this.validateLogo(file, fileSignature);
  }

  fieldError(fieldName: string): string | null {
    const backendError = this.apiFieldErrors()[fieldName];
    if (backendError) {
      return backendError;
    }

    if (fieldName === 'logo' && this.logoValidationState() === 'invalid') {
      return this.logoValidationMessage();
    }

    const control = this.step2Form.controls[fieldName as keyof typeof this.step2Form.controls];

    if (!control || !(control.touched || this.submitted())) {
      if (
        fieldName === 'confirmAdminPassword' &&
        control?.hasError('passwordMismatch') &&
        (this.step2Form.controls.adminPassword.value || this.step2Form.controls.confirmAdminPassword.value)
      ) {
        return 'As senhas precisam ser iguais.';
      }
      return null;
    }

    if (control.hasError('required')) {
      return 'Campo obrigatório.';
    }

    if (control.hasError('minlength')) {
      return 'Informe pelo menos 8 caracteres.';
    }

    if (fieldName === 'confirmAdminPassword' && control.hasError('passwordMismatch')) {
      return 'As senhas precisam ser iguais.';
    }

    if (control.hasError('weakPassword')) {
      return 'Senha fraca. Use letras maiúsculas, minúsculas, números e símbolos.';
    }

    if (control.hasError('maxlength')) {
      return 'Valor acima do limite permitido.';
    }

    return null;
  }

  logoValidationHint(): string {
    if (this.logoValidationState() === 'validating') {
      return 'Validando logo...';
    }

    if (this.logoValidationState() === 'valid') {
      return 'Logo validado com sucesso.';
    }

    return 'PNG ou JPEG com fundo transparente, entre 128x128 e 1024x1024, até 5MB.';
  }

  leagueNameValidationHint(): string {
    return this.leagueNameValidationMessage();
  }

  private getStep2ErrorMessage(status: number, fallbackMessage: string): string {
    if (status === 404) {
      return 'Token não encontrado. Inicie novamente em Criar liga.';
    }

    if (status === 500) {
      return 'Erro interno. Tente novamente em instantes.';
    }

    if (status === 409) {
      return 'Não foi possível concluir. Revise o nome da liga e tente novamente.';
    }

    if (status === 400 && fallbackMessage.toLowerCase().includes('token')) {
      return 'Seu link expirou. Inicie novamente em Criar liga.';
    }

    return fallbackMessage;
  }

  private validateLogo(file: File, fileSignature: string): void {
    this.logoValidationState.set('validating');
    this.logoValidationMessage.set(null);
    this.validatingLogoSignature.set(fileSignature);

    this.onboardingApiService
      .validateStep2Logo(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.selectedLogoSignature() !== fileSignature) {
            return;
          }

          this.logoValidationState.set('valid');
          this.logoValidationMessage.set(null);
          this.validatingLogoSignature.set(null);
        },
        error: (error: unknown) => {
          if (this.selectedLogoSignature() !== fileSignature) {
            return;
          }

          const normalizedError = this.onboardingApiService.normalizeApiError(error);
          const backendMessage = normalizedError.fieldErrors['logo'] ?? normalizedError.message;

          this.logoValidationState.set('invalid');
          this.logoValidationMessage.set(this.getLogoValidationErrorMessage(normalizedError.status, backendMessage));
          this.validatingLogoSignature.set(null);
        },
      });
  }

  private getLogoValidationErrorMessage(status: number, fallbackMessage: string): string {
    if (status <= 0 || status >= 500) {
      return 'Não foi possível validar o logo agora. Selecione o arquivo novamente.';
    }

    return this.translateLogoValidationMessage(fallbackMessage);
  }

  private translateLogoValidationMessage(message: string): string {
    const normalized = message.toLowerCase();

    if (normalized.includes('empty background') || normalized.includes('transparent background')) {
      return 'A logo da liga precisa ter fundo transparente.';
    }

    if (normalized.includes('must be') && normalized.includes('mb')) {
      return 'A logo deve ter no máximo 5MB.';
    }

    if (
      normalized.includes('png') ||
      normalized.includes('jpeg') ||
      normalized.includes('jpg') ||
      normalized.includes('file type') ||
      normalized.includes('content type')
    ) {
      return 'Formato inválido. Use PNG ou JPEG.';
    }

    if (normalized.includes('dimension') || normalized.includes('width') || normalized.includes('height')) {
      return 'A logo deve ter dimensões entre 128x128 e 1024x1024.';
    }

    return 'Logo inválida. Selecione outro arquivo.';
  }

  private getLogoSignature(file: File): string {
    return `${file.name}-${file.size}-${file.type}-${file.lastModified}`;
  }

  private toDomainKey(leagueName: string): string {
    const normalized = leagueName
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');

    return normalized;
  }

  private toLeagueNameNormalized(leagueName: string): string {
    return leagueName
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  private shouldValidateLeagueName(normalizedLeagueName: string): boolean {
    return normalizedLeagueName.length > 0 && !this.step2Form.controls.leagueName.hasError('maxlength');
  }

  private prepareLeagueNameValidation(leagueName: string): void {
    const hasValue = leagueName.trim().length > 0;

    if (!hasValue) {
      this.leagueNameValidationState.set('idle');
      this.leagueNameValidationMessage.set('Digite o nome da liga para validar a disponibilidade.');
      return;
    }

    if (this.step2Form.controls.leagueName.hasError('maxlength')) {
      this.leagueNameValidationState.set('idle');
      this.leagueNameValidationMessage.set('Valor acima do limite permitido.');
      return;
    }

    this.leagueNameValidationState.set('validating');
    this.leagueNameValidationMessage.set('Validando disponibilidade do nome da liga...');
  }

  private resetLogoValidationState(): void {
    this.logoValidationState.set('idle');
    this.logoValidationMessage.set(null);
    this.selectedLogoSignature.set(null);
    this.validatingLogoSignature.set(null);
    this.apiFieldErrors.update((current) => {
      const next = { ...current };
      delete next['logo'];
      return next;
    });
  }

  private clearLogoPreviewUrl(): void {
    const currentPreviewUrl = this.selectedLogoPreviewUrl();
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      this.selectedLogoPreviewUrl.set(null);
    }
  }

  private updatePasswordMatchState(): void {
    const password = this.step2Form.controls.adminPassword.value;
    const confirmPassword = this.step2Form.controls.confirmAdminPassword.value;
    const confirmControl = this.step2Form.controls.confirmAdminPassword;
    const currentErrors = { ...(confirmControl.errors ?? {}) };

    delete currentErrors['passwordMismatch'];

    if (!password && !confirmPassword) {
      confirmControl.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
      return;
    }

    if (password !== confirmPassword) {
      confirmControl.setErrors({
        ...currentErrors,
        passwordMismatch: true,
      });
      return;
    }

    confirmControl.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
  }
}
