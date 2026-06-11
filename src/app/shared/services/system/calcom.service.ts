import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare global {
  interface Window {
    Cal: any;
  }
}

@Injectable({ providedIn: 'root' })
export class CalcomService {
  private readonly isBrowser: boolean;
  private scriptLoadPromise: Promise<void> | null = null;
  private readonly SCRIPT_URL = 'https://app.cal.com/embed/embed.js';

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.defineGlobalCal();
      this.loadScript();
    }
  }

  private defineGlobalCal(): void {
    if (window.Cal?.q) return;
    (window.Cal as any) = (...args: any[]) => {
      window.Cal.q = window.Cal.q || [];
      window.Cal.q.push(args);
    };
    window.Cal.ns = {};
    window.Cal.q = [];
  }

  loadScript(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    if (this.scriptLoadPromise) return this.scriptLoadPromise;

    if (
      document.querySelector(`script[src="${this.SCRIPT_URL}"]`) &&
      window.Cal?.loaded
    ) {
      this.scriptLoadPromise = Promise.resolve();
      return this.scriptLoadPromise;
    }

    const t = performance.now();

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://app.cal.com';
      document.head.appendChild(preconnect);

      const script = document.createElement('script');
      script.src = this.SCRIPT_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        resolve();
      };
      script.onerror = (err) => {
        console.error('[CalcomService] error cargando script', err);
        reject(err);
      };
      document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }

  isNamespaceReady(namespace: string): boolean {
    return typeof window.Cal?.ns?.[namespace] === 'function';
  }

  getInstance(namespace: string): any {
    return window.Cal?.ns?.[namespace];
  }

  get isScriptLoaded(): boolean {
    return !!window.Cal?.loaded;
  }
}
