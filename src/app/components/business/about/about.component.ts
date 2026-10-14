import {
  Component,
  computed,
  inject,
  signal,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  DestroyRef,
  output,
  effect,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AboutStateService } from '../../../shared/services/features/about-state.service';
import { ImageUrlService } from '../../../shared/services/system/image-url.service';
import { HomeData } from '../../../shared/interfaces/homeData.interface';
import { environment } from '../../../../environments/environment';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

// =========================================================
// 1. COMPONENTE HIJO: EQUIPO (MANAGERS)
// =========================================================
@Component({
  selector: 'app-about-team',
  standalone: true,
  imports: [TranslocoModule, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [],
  template: `
    @if (isLoading()) {
      <div class="section bg-cream">
        <div class="container-x">
          <div class="h-3 w-40 animate-pulse rounded-sm bg-slate-200"></div>
          <div class="mt-4 h-10 w-2/3 animate-pulse rounded-sm bg-slate-200"></div>
          <div class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="aspect-[4/5] animate-pulse rounded-md bg-slate-200"></div>
            }
          </div>
        </div>
      </div>
    } @else if (hasData()) {
      <section class="section bg-cream">
        <div class="container-x">
          <div class="max-w-2xl">
            <h2
              class="eyebrow"
              appScrollReveal
              [revealAnimation]="'slide-up'"
              [revealDelay]="0"
            >
              {{ 'about.team.title' | transloco }}
            </h2>
            <p
              class="heading-lg mt-4"
              appScrollReveal
              [revealAnimation]="'slide-up'"
              [revealDelay]="100"
            >
              {{ 'about.team.subtitle' | transloco }}
            </p>
            <p
              class="lead mt-4"
              appScrollReveal
              [revealAnimation]="'slide-up'"
              [revealDelay]="200"
            >
              {{ 'about.team.text' | transloco }}
            </p>
          </div>

          <div class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            @for (
              manager of managerData();
              track trackByFn($index, manager);
              let i = $index
            ) {
              <article
                class="group flex flex-col"
                appScrollReveal
                [revealAnimation]="'slide-up'"
                [revealDelay]="i * 100"
              >
                <div
                  class="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-md bg-slate-200"
                  (click)="
                    manager.imageUrl && !isUsingDefault(manager.imageUrl) &&
                    onZoom.emit({
                      url: manager.imageUrl,
                      title: manager.title,
                    })
                  "
                >
                  <img
                    [src]="manager.imageUrl"
                    (error)="handleImageError($event)"
                    class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    [alt]="manager.title"
                    loading="lazy"
                  />
                  <div
                    class="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent"
                  ></div>
                  <div class="absolute inset-x-0 bottom-0 p-5">
                    <span class="badge bg-coral-400 text-ink">
                      {{ manager.charge }}
                    </span>
                    <h3 class="mt-3 text-xl font-bold tracking-tight text-white">
                      {{ manager.title }}
                    </h3>
                  </div>
                </div>
                @if (manager.description) {
                  <p
                    class="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600"
                  >
                    {{ manager.description }}
                  </p>
                }
              </article>
            }
          </div>
        </div>
      </section>
    } @else {
      <div class="section bg-cream">
        <div class="container-x text-center">
          <p class="text-base text-slate-500">
            {{ 'about.nodata.team' | transloco }}
          </p>
        </div>
      </div>
    }
  `,
})
export class AboutTeamComponent {
  private readonly aboutState = inject(AboutStateService);
  private readonly imageUrls = inject(ImageUrlService);

  // Output como signal
  readonly onZoom = output<{ url: string; title: string }>();

  // Signals del estado
  readonly managerData = this.aboutState.managerWithImages$;
  readonly isLoading = this.aboutState.isManagerLoading$;

  // Computed para verificar si hay datos
  readonly hasData = computed(() => this.managerData().length > 0);

  constructor() {
    // Cargar datos iniciales
    this.aboutState.loadManagerOnly();

    // Efecto para manejar cambios en los datos
    effect(() => {
      const data = this.managerData();
      const loading = this.isLoading();

      if (!loading && data.length === 0) {
        // Podrías agregar lógica adicional aquí si es necesario
      }
    });
  }

  // Maneja el error cuando la imagen SÍ existe en BD pero NO físicamente (404)
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    // Prevenir loop infinito: solo intentar cargar la imagen por defecto una vez
    if (!imgElement.src.includes('users_default.webp')) {
      imgElement.src = this.imageUrls.defaultImage('user');
    }
  }

  // Helper para ocultar el botón de zoom si es la imagen por defecto
  isUsingDefault(url: string | null | undefined): boolean {
    return this.imageUrls.isDefaultImage(url);
  }

  trackByFn(index: number, item: HomeData): string | number {
    return item.id ? `item_${item.id}` : index;
  }
}

// =========================================================
// 2. COMPONENTE PRINCIPAL (PADRE)
// =========================================================
@Component({
  selector: 'app-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    CommonModule,
    AboutTeamComponent,
    ScrollRevealDirective,
  ],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  private readonly aboutState = inject(AboutStateService);
  private readonly imageUrls = inject(ImageUrlService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Señales del estado
  readonly companyData = this.aboutState.companyWithImages$;
  readonly isCompanyLoading = this.aboutState.isCompanyLoading$;
  readonly hasCompanyData = computed(() => this.companyData().length > 0);

  // UI Signals
  readonly isHeaderLoaded = signal(false);
  readonly isCompanyDataLoaded = signal(false);

  // Modal Signals
  readonly showMediaZoom = signal(false);
  readonly zoomedMediaUrl = signal<string>('');
  readonly zoomedMediaTitle = signal<string>('');

  // Constantes
  protected readonly DEFAULT_IMAGE = this.imageUrls.defaultImage('content');
  protected readonly path = environment.staticImgPath;

  constructor() {
    // Cargar datos iniciales
    if (this.isBrowser) {
      this.aboutState.loadCompanyOnly();
    }

    // Efecto para animación del header
    if (this.isBrowser) {
      setTimeout(() => {
        this.isHeaderLoaded.set(true);
      }, 150);
    }

    // Efecto para verificar carga de datos de la empresa
    effect(() => {
      const hasData = this.hasCompanyData();
      const loading = this.isCompanyLoading();

      if (
        (hasData || !loading) &&
        this.isBrowser &&
        !this.isCompanyDataLoaded()
      ) {
        setTimeout(() => {
          this.isCompanyDataLoaded.set(true);
        }, 200);
      }
    });

    // Configurar efecto para cierre de modal con Escape
    this.setupModalEscapeEffect();

    // Limpieza automática
    this.destroyRef.onDestroy(() => {
      if (this.isBrowser) {
        document.body.style.overflow = 'auto';
      }
    });
  }

  trackByFn(index: number, item: HomeData): string | number {
    return item.id ? `item_${item.id}` : index;
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    // Prevenir loop infinito: solo intentar cargar la imagen por defecto una vez
    if (!imgElement.src.includes('img_default.webp')) {
      imgElement.src = this.DEFAULT_IMAGE;
    }
  }

  // Lógica del Modal (Zoom)
  openMediaZoom(mediaUrl: string, title: string): void {
    this.zoomedMediaUrl.set(mediaUrl);
    this.zoomedMediaTitle.set(title);
    this.showMediaZoom.set(true);

    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  // Método auxiliar para recibir evento desde el hijo
  handleZoomEvent(event: { url: string; title: string }): void {
    this.openMediaZoom(event.url, event.title);
  }

  closeMediaZoom(): void {
    this.showMediaZoom.set(false);
    this.zoomedMediaUrl.set('');
    this.zoomedMediaTitle.set('');

    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
  }

  // Efecto para manejar cierre de modal con Escape
  private setupModalEscapeEffect(): void {
    effect(() => {
      if (this.showMediaZoom() && this.isBrowser) {
        const handleEscape = (event: KeyboardEvent) => {
          if (event.key === 'Escape' || event.key === 'Esc') {
            this.closeMediaZoom();
          }
        };

        window.addEventListener('keydown', handleEscape);

        // Cleanup cuando el modal se cierra o el componente se destruye
        return () => {
          window.removeEventListener('keydown', handleEscape);
        };
      }
      // Retornar función de limpieza vacía cuando no se cumple la condición
      return () => {};
    });
  }
}
