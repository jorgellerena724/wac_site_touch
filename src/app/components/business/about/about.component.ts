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
import { HomeData } from '../../../shared/interfaces/homeData.interface';
import { environment } from '../../../../environments/environment';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { BorderBeamDirective } from '../../../shared/directives/border-beam.directive';

// =========================================================
// 1. COMPONENTE HIJO: EQUIPO (MANAGERS)
// =========================================================
@Component({
  selector: 'app-about-team',
  standalone: true,
  imports: [TranslocoModule, ScrollRevealDirective, BorderBeamDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [],
  template: `
    @if (isLoading()) {
      <div class="py-16 bg-white/50 border-t border-surface">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <div
              class="h-8 bg-gray-200 rounded-full w-48 mx-auto mb-4 animate-pulse"
            ></div>
            <div
              class="h-10 bg-gray-200 rounded w-3/4 mx-auto mb-2 animate-pulse"
            ></div>
            <div
              class="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"
            ></div>
          </div>
          <div class="mt-20 flex flex-wrap justify-center gap-8">
            @for (i of [1, 2, 3]; track i) {
              <div class="text-center">
                <div
                  class="mx-auto h-56 w-56 rounded-full bg-gray-200 animate-pulse"
                ></div>
                <div class="mt-6">
                  <div class="h-6 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                  <div class="h-4 bg-gray-200 rounded w-24 mx-auto mb-4"></div>
                  <div class="h-3 bg-gray-200 rounded w-48 mx-auto"></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    } @else if (hasData()) {
      <div
        class="py-16 bg-white/50 border-t border-surface overflow-hidden relative"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="text-center">
            <h2
              class="inline-block text-sm font-bold text-primary-dark tracking-wider uppercase bg-gradient-to-r from-primary-light to-accent-light px-4 py-2 rounded-full border border-surface"
              appScrollReveal
              [revealAnimation]="'slide-up'"
              [revealDelay]="0"
            >
              {{ 'about.team.title' | transloco }}
            </h2>
            <p
              class="mt-4 text-3xl font-extrabold text-primary sm:text-4xl drop-shadow-sm"
              appScrollReveal
              [revealAnimation]="'slide-up'"
              [revealDelay]="100"
            >
              {{ 'about.team.subtitle' | transloco }}
            </p>
            <p
              class="mt-4 max-w-2xl text-xl text-slate-600 mx-auto leading-relaxed"
              appScrollReveal
              [revealAnimation]="'slide-up'"
              [revealDelay]="200"
            >
              {{ 'about.team.text' | transloco }}
            </p>
          </div>

          <div class="mt-20 flex flex-wrap justify-center gap-8">
            @for (
              manager of managerData();
              track trackByFn($index, manager);
              let i = $index
            ) {
              <div
                class="group relative text-center max-w-[320px] transform transition-all duration-300 hover:-translate-y-2 mt-4 cursor-pointer"
                appScrollReveal
                [revealAnimation]="'slide-up'"
                [revealDelay]="i * 100"
              >
                <div
                  class="relative mx-auto h-56 w-56 rounded-full overflow-hidden shadow-[0_0_20px_rgba(28, 119, 144,0.15)] ring-4 ring-surface group-hover:shadow-[0_0_30px_rgba(28, 119, 144,0.25)] group-hover:ring-accent transition-all duration-300 cursor-pointer"
                  appBorderBeam
                  [beamColor]="'rgba(28, 119, 144, 0.7)'"
                  [beamWidth]="'3px'"
                  [beamDuration]="'5s'"
                  [beamDelay]="i * 0.6 + 's'"
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
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    [alt]="manager.title"
                    loading="lazy"
                  />
                </div>

                  <div class="mt-2 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <h3
                      class="text-xl font-semibold text-center text-primary-dark transition-colors duration-300 group-hover:text-primary-dark"
                    >
                      {{ manager.title }}
                    </h3>
                  </div>
                  <div
                    class="mx-auto w-fit mt-1 px-3 py-1 bg-primary-light text-primary-dark rounded-full text-sm font-medium transition-colors duration-300 group-hover:bg-surface-light"
                  >
                    {{ manager.charge }}
                  </div>
                  <p
                    class="mt-4 text-base text-slate-600 leading-relaxed max-w-xs mx-auto whitespace-pre-line transition-colors duration-300 group-hover:text-slate-700"
                  >
                    {{ manager.description }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="py-16 bg-white/50 border-t border-surface">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p class="text-slate-500 text-lg">
            {{ 'about.nodata.team' | transloco }}
          </p>
        </div>
      </div>
    }
  `,
})
export class AboutTeamComponent {
  private readonly aboutState = inject(AboutStateService);

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

  // Método para obtener la URL correcta de la imagen
  getImageUrl(imageUrl: string | null | undefined): string {
    return this.aboutState.getImageUrl(imageUrl);
  }

  // Maneja el error cuando la imagen SÍ existe en BD pero NO físicamente (404)
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    // Prevenir loop infinito: solo intentar cargar la imagen por defecto una vez
    if (!imgElement.src.includes('users_default.webp')) {
      imgElement.src = this.aboutState.getDefaultImageUrl();
    }
  }

  // Helper para ocultar el botón de zoom si es la imagen por defecto
  isUsingDefault(url: string | null | undefined): boolean {
    return this.aboutState.isDefaultImage(url);
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
  protected readonly DEFAULT_IMAGE = `${environment.imgPath}img_default.webp`;
  protected readonly path = environment.imgPath;

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
