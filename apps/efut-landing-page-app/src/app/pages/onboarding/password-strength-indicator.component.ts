import { Component, input } from '@angular/core';
import { PasswordStrengthResult } from './password-strength.util';

@Component({
  selector: 'app-password-strength-indicator',
  template: `
    <div class="strength-shell" aria-live="polite">
      <p class="strength-label">
        Nível da senha:
        <span [class]="strength().level">{{ strength().label }}</span>
      </p>
      <div class="strength-track" aria-hidden="true">
        <div class="strength-fill" [class]="strength().level" [style.width.%]="strength().percent"></div>
      </div>
    </div>
  `,
  styles: `
    .strength-shell {
      display: grid;
      gap: 0.3rem;
    }

    .strength-label {
      margin: 0;
      font-size: 0.8rem;
      color: #9eb6b9;
    }

    .strength-label span {
      font-weight: 700;
    }

    .strength-label .low {
      color: #ffb3b3;
    }

    .strength-label .medium {
      color: #ffe39b;
    }

    .strength-label .high {
      color: #8cf3b1;
    }

    .strength-track {
      height: 0.4rem;
      border-radius: 999px;
      background: rgba(229, 240, 239, 0.12);
      overflow: hidden;
    }

    .strength-fill {
      height: 100%;
      transition: width 180ms ease;
    }

    .strength-fill.low {
      background: linear-gradient(90deg, #ff7e7e, #ffb3b3);
    }

    .strength-fill.medium {
      background: linear-gradient(90deg, #f5c05a, #ffe39b);
    }

    .strength-fill.high {
      background: linear-gradient(90deg, #1fda8f, #6df0b7);
    }
  `,
})
export class PasswordStrengthIndicatorComponent {
  readonly strength = input.required<PasswordStrengthResult>();
}
