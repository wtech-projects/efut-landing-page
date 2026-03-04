import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@libs/environment';
import { Observable } from 'rxjs';
import {
  OnboardingApiError,
  OnboardingFieldError,
  OnboardingLeagueNameValidationRequest,
  OnboardingLeagueNameValidationResult,
  OnboardingLogoValidationResult,
  OnboardingStep1Request,
  OnboardingStep2Request,
} from './onboarding.types';

interface ApiErrorResponse {
  status?: number;
  message?: string;
  fieldErrors?: OnboardingFieldError[];
}

@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = `${environment.onboardingBaseUrl.replace(/\/$/, '')}/api/v1/onboarding`;

  submitStep1(payload: OnboardingStep1Request): Observable<void> {
    return this.httpClient.post<void>(`${this.apiBaseUrl}/step-1`, payload);
  }

  submitStep2(payload: OnboardingStep2Request): Observable<void> {
    return this.httpClient.post<void>(`${this.apiBaseUrl}/step-2`, this.buildStep2FormData(payload));
  }

  validateStep2Logo(logo: File): Observable<OnboardingLogoValidationResult> {
    const formData = new FormData();
    formData.append('logo', logo);

    return this.httpClient.post<OnboardingLogoValidationResult>(`${this.apiBaseUrl}/step-2/logo-validation`, formData);
  }

  validateStep2LeagueName(
    payload: OnboardingLeagueNameValidationRequest
  ): Observable<OnboardingLeagueNameValidationResult> {
    return this.httpClient.post<OnboardingLeagueNameValidationResult>(
      `${this.apiBaseUrl}/step-2/league-name-validation`,
      payload
    );
  }

  buildStep2FormData(payload: OnboardingStep2Request): FormData {
    const formData = new FormData();
    formData.append('token', payload.token);
    formData.append('leagueName', payload.leagueName);
    formData.append('state', payload.state);
    formData.append('adminLogin', payload.adminLogin);
    formData.append('adminPassword', payload.adminPassword);
    formData.append('logo', payload.logo);

    return formData;
  }

  normalizeApiError(error: unknown): OnboardingApiError {
    if (!(error instanceof HttpErrorResponse)) {
      return {
        status: 0,
        message: 'Falha inesperada. Tente novamente.',
        fieldErrors: {},
      };
    }

    const apiError = (error.error ?? {}) as ApiErrorResponse;

    return {
      status: error.status || apiError.status || 0,
      message: apiError.message ?? 'Não foi possível concluir a solicitação.',
      fieldErrors: this.toFieldErrorMap(apiError.fieldErrors ?? []),
    };
  }

  private toFieldErrorMap(fieldErrors: OnboardingFieldError[]): Record<string, string> {
    return fieldErrors.reduce<Record<string, string>>((acc, item) => {
      if (!item.field || !item.message) {
        return acc;
      }

      acc[item.field] = item.message;
      return acc;
    }, {});
  }
}
