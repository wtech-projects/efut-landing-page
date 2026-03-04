export interface OnboardingStep1Request {
  firstName: string;
  lastName: string;
  whatsapp: string;
  email: string;
  humanVerificationToken: string;
}

export interface OnboardingStep2Request {
  token: string;
  leagueName: string;
  state: string;
  adminLogin: string;
  adminPassword: string;
  logo: File;
}

export interface OnboardingFieldError {
  field: string;
  message: string;
}

export interface OnboardingApiError {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
}

export interface OnboardingLogoValidationResult {
  valid: boolean;
  width: number;
  height: number;
  hasTransparency: boolean;
}

export interface OnboardingLeagueNameValidationRequest {
  leagueNameNormalized: string;
}

export interface OnboardingLeagueNameValidationResult {
  available: boolean;
  message: string;
}
