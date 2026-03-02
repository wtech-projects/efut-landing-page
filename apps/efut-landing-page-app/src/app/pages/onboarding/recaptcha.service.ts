import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

interface RecaptchaWindow extends Window {
  grecaptcha?: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

@Injectable({ providedIn: 'root' })
export class RecaptchaService {
  private readonly document = inject(DOCUMENT);
  private readonly scriptId = 'google-recaptcha-v3-script';
  private loadPromise: Promise<void> | null = null;

  loadApi(siteKey: string, language = 'pt-BR'): Promise<void> {
    const windowRef = this.getWindow();

    if (windowRef.grecaptcha?.ready) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise<void>((resolve, reject) => {
      const existingScript = this.document.getElementById(this.scriptId) as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('captcha-script-load-failed')), {
          once: true,
        });
        return;
      }

      const script = this.document.createElement('script');
      script.id = this.scriptId;
      script.async = true;
      script.defer = true;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}&hl=${language}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('captcha-script-load-failed'));
      this.document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  async execute(siteKey: string, action: string): Promise<string> {
    const windowRef = this.getWindow();

    if (!windowRef.grecaptcha?.ready || !windowRef.grecaptcha?.execute) {
      throw new Error('captcha-not-available');
    }

    await new Promise<void>((resolve) => {
      windowRef.grecaptcha?.ready(() => resolve());
    });

    const token = await windowRef.grecaptcha.execute(siteKey, { action });

    if (!token) {
      throw new Error('captcha-token-empty');
    }

    return token;
  }

  private getWindow(): RecaptchaWindow {
    return this.document.defaultView as RecaptchaWindow;
  }
}
