import {
  Component,
  inject,
  signal,
  computed,
  viewChild,
  DestroyRef,
  ChangeDetectionStrategy,
  PLATFORM_ID,
  input,
  output,
  Injector,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CalcomService } from '../../../shared/services/system/calcom.service';
import { ProductVariant } from '../../../shared/interfaces/productData.interface';
import { TranslocoModule } from '@jsverse/transloco';
import { MetricsService } from '../../services/system/metrics.service';

@Component({
  selector: 'app-calcom',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './app-calcom.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalcomComponent {
  private readonly calcomService = inject(CalcomService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly metricsService = inject(MetricsService);

  readonly calUrl = input<string>('');
  readonly initialVariant = input<ProductVariant | null>(null);
  readonly initialVariantIndex = input<number | null>(null);

  readonly bookingCompleted = output<any>();
  readonly bookingCancelled = output<void>();

  readonly calContainer = viewChild<ElementRef<HTMLDivElement>>('calContainer');

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly errorMessage = signal('');

  readonly shouldShowLoading = computed(
    () => this.isLoading() && !this.hasError(),
  );
  readonly shouldShowError = computed(
    () => this.hasError() && !this.isLoading(),
  );
  readonly shouldShowCalendar = computed(
    () => !this.isLoading() && !this.hasError(),
  );

  readonly containerId = signal('');

  private _namespace = '';
  private _containerId = '';
  private rafId: number | null = null;
  private destroyed = false;

  private readonly NAMESPACE_TIMEOUT_MS = 600;

  constructor() {
    if (this.isBrowser) {
      afterNextRender(
        () => {
          const url = this.calUrl()?.trim();
          if (url) {
            this.initialize(url);
          } else {
            this.handleError('No se ha configurado un enlace de calendario.');
          }
        },
        { injector: this.injector },
      );
    }

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.cleanup();
    });
  }

  private async initialize(url: string): Promise<void> {
    try {
      const cleanUrl = url
        .replace(/^https?:\/\//i, '')
        .replace(/^(www\.)?cal\.com\//i, '')
        .trim();

      this._namespace = this.generateNamespace(cleanUrl);
      this._containerId = `cal-${this._namespace}-${Date.now()}`;
      this.containerId.set(this._containerId);

      await this.calcomService.loadScript();

      if (this.destroyed) return;

      window.Cal('init', this._namespace, { origin: 'https://app.cal.com' });

      const namespaceReady = await this.waitForNamespaceWithRAF(
        this._namespace,
        this.NAMESPACE_TIMEOUT_MS,
      );

      if (this.destroyed) return;

      if (namespaceReady) {
        this.mountEmbed(this._namespace, this._containerId, cleanUrl);
      } else {
        this.tryFallbackIframe();
      }
    } catch {
      if (!this.destroyed) {
        this.tryFallbackIframe();
      }
    }
  }

  private waitForNamespaceWithRAF(
    namespace: string,
    maxMs: number,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.calcomService.isNamespaceReady(namespace)) {
        resolve(true);
        return;
      }

      const start = performance.now();

      const check = () => {
        if (this.destroyed) {
          resolve(false);
          return;
        }

        if (this.calcomService.isNamespaceReady(namespace)) {
          resolve(true);
          return;
        }

        if (performance.now() - start >= maxMs) {
          resolve(false);
          return;
        }

        this.rafId = requestAnimationFrame(check);
      };

      this.rafId = requestAnimationFrame(check);
    });
  }

  private mountEmbed(
    namespace: string,
    containerId: string,
    calLink: string,
  ): void {
    const container = this.calContainer();
    if (!container) {
      this.tryFallbackIframe();
      return;
    }

    const calInstance = this.calcomService.getInstance(namespace);
    if (typeof calInstance !== 'function') {
      this.tryFallbackIframe();
      return;
    }

    const el = container.nativeElement;
    el.style.colorScheme = 'light';
    el.setAttribute('data-theme', 'light');
    el.style.width = '100%';
    el.style.minHeight = '600px';

    const calLinkWithTheme = calLink.includes('?')
      ? `${calLink}&theme=light`
      : `${calLink}?theme=light`;

    this.isLoading.set(false);

    calInstance('inline', {
      elementOrSelector: `#${containerId}`,
      calLink: calLinkWithTheme,
      config: { layout: 'month_view', theme: 'light' },
    });

    this.setupEventListeners(calInstance);
  }

  private setupEventListeners(calInstance: any): void {
    try {
      calInstance('on', {
        action: 'bookingSuccessful',
        callback: (e: any) => this.bookingCompleted.emit(e.detail),
      });
      calInstance('on', {
        action: '__closeIframe',
        callback: () => this.bookingCancelled.emit(),
      });
    } catch {
      // event listeners no críticos
    }
  }

  private tryFallbackIframe(): void {
    const container = this.calContainer();
    if (!container) {
      this.handleError('Error al cargar el calendario.');
      return;
    }

    const cleanUrl = (this.calUrl()?.trim() ?? '')
      .replace(/^https?:\/\//i, '')
      .replace(/^(www\.)?cal\.com\//i, '')
      .trim();

    const src = new URL(`https://cal.com/${cleanUrl}`);
    src.searchParams.set('theme', 'light');

    container.nativeElement.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = src.toString();
    iframe.style.cssText =
      'width:100%;height:600px;border:none;border-radius:8px;';
    iframe.setAttribute('loading', 'eager');
    container.nativeElement.appendChild(iframe);

    this.isLoading.set(false);

    this.metricsService.incrementMetric('bookings').subscribe({
      next: () => console.log('✅ métrica registrada desde fallback'),
      error: (e) => console.error('❌ error métrica', e),
    });
  }

  private generateNamespace(calUrl: string): string {
    const parts = calUrl.split('/');
    const last = (parts[parts.length - 1] || 'event')
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .toLowerCase();
    return last.length > 20 ? last.substring(0, 20) : last;
  }

  private handleError(message: string): void {
    this.hasError.set(true);
    this.errorMessage.set(message);
    this.isLoading.set(false);
  }

  retry(): void {
    this.hasError.set(false);
    this.errorMessage.set('');
    this.isLoading.set(true);

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.destroyed = false;
    const url = this.calUrl()?.trim();
    if (url) this.initialize(url);
  }

  private cleanup(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    const namespace = this._namespace;
    if (this.isBrowser && namespace && window.Cal?.ns?.[namespace]) {
      try {
        const instance = window.Cal.ns[namespace];
        if (typeof instance === 'function') instance('destroy');
        delete window.Cal.ns[namespace];
      } catch {
        // cleanup best-effort
      }
    }
  }
}
