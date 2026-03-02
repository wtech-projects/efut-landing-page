export interface OnboardingStep1Request {
  firstName: string;
  lastName: string;
  whatsapp: string;
  email: string;
}

export interface OnboardingStep2Request {
  token: string;
  leagueName: string;
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
