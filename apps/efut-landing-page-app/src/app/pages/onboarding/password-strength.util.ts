export type PasswordStrengthLevel = 'low' | 'medium' | 'high';

export interface PasswordStrengthResult {
  score: number;
  level: PasswordStrengthLevel;
  label: string;
  percent: number;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const value = password ?? '';

  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  let level: PasswordStrengthLevel = 'low';
  let label = 'Fraca';

  if (score >= 4) {
    level = 'high';
    label = 'Forte';
  } else if (score >= 3) {
    level = 'medium';
    label = 'Média';
  }

  return {
    score,
    level,
    label,
    percent: Math.round((score / 5) * 100),
  };
}
