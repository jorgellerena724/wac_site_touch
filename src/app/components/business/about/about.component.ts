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
  styles: [
    `
      .wind-effect-wrapper-team {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        overflow: visible;
      }

      .wind-effect-wrapper-team .leaf {
        position: absolute;
        font-size: 24px;
        opacity: 0;
      }

      .wind-effect-wrapper-team .leaf-1 {
        top: 5%;
        left: -80px;
        animation: leaf-float-left 20s ease-in-out infinite;
      }
      .wind-effect-wrapper-team .leaf-2 {
        top: 25%;
        left: -90px;
        animation: leaf-float-left 22s ease-in-out infinite 2s;
      }
      .wind-effect-wrapper-team .leaf-3 {
        top: 45%;
        left: -85px;
        animation: leaf-float-left 21s ease-in-out infinite 4s;
      }
      .wind-effect-wrapper-team .leaf-4 {
        top: 65%;
        left: -95px;
        animation: leaf-float-left 23s ease-in-out infinite 6s;
      }
      .wind-effect-wrapper-team .leaf-5 {
        top: 85%;
        left: -88px;
        animation: leaf-float-left 19s ease-in-out infinite 1s;
      }
      .wind-effect-wrapper-team .leaf-6 {
        top: 10%;
        right: -80px;
        animation: leaf-float-right 21s ease-in-out infinite 1.5s;
      }
      .wind-effect-wrapper-team .leaf-7 {
        top: 30%;
        right: -90px;
        animation: leaf-float-right 23s ease-in-out infinite 3.5s;
      }
      .wind-effect-wrapper-team .leaf-8 {
        top: 50%;
        right: -85px;
        animation: leaf-float-right 20s ease-in-out infinite 5.5s;
      }
      .wind-effect-wrapper-team .leaf-9 {
        top: 70%;
        right: -95px;
        animation: leaf-float-right 22s ease-in-out infinite 7.5s;
      }
      .wind-effect-wrapper-team .leaf-10 {
        top: 90%;
        right: -88px;
        animation: leaf-float-right 24s ease-in-out infinite 0.5s;
      }
      .wind-effect-wrapper-team .leaf-11 {
        top: -60px;
        left: 20%;
        animation: leaf-float-down 24s ease-in-out infinite 1s;
      }
      .wind-effect-wrapper-team .leaf-12 {
        top: -60px;
        left: 50%;
        animation: leaf-float-down 22s ease-in-out infinite 3s;
      }
      .wind-effect-wrapper-team .leaf-13 {
        top: -60px;
        left: 80%;
        animation: leaf-float-down 23s ease-in-out infinite 5s;
      }
      .wind-effect-wrapper-team .leaf-14 {
        bottom: -60px;
        left: 25%;
        animation: leaf-float-up 21s ease-in-out infinite 2s;
      }
      .wind-effect-wrapper-team .leaf-15 {
        bottom: -60px;
        left: 55%;
        animation: leaf-float-up 23s ease-in-out infinite 4s;
      }
      .wind-effect-wrapper-team .leaf-16 {
        bottom: -60px;
        left: 75%;
        animation: leaf-float-up 22s ease-in-out infinite 6s;
      }
      .wind-effect-wrapper-team .leaf-17 {
        top: 15%;
        left: -92px;
        animation: leaf-float-left 24s ease-in-out infinite 3.5s;
      }
      .wind-effect-wrapper-team .leaf-18 {
        top: 55%;
        right: -92px;
        animation: leaf-float-right 21s ease-in-out infinite 4.5s;
      }

      @keyframes leaf-float-left {
        0% {
          opacity: 0;
          transform: translateX(0) translateY(0) rotate(0deg) scale(0.8);
        }
        10% {
          opacity: 0.4;
        }
        30% {
          transform: translateX(100px) translateY(-15px) rotate(45deg)
            scale(0.9);
        }
        50% {
          transform: translateX(200px) translateY(-25px) rotate(90deg) scale(1);
        }
        70% {
          transform: translateX(300px) translateY(-15px) rotate(135deg)
            scale(0.9);
        }
        90% {
          opacity: 0.4;
        }
        100% {
          opacity: 0;
          transform: translateX(400px) translateY(0) rotate(180deg) scale(0.8);
        }
      }

      @keyframes leaf-float-right {
        0% {
          opacity: 0;
          transform: translateX(0) translateY(0) rotate(0deg) scale(0.8);
        }
        10% {
          opacity: 0.4;
        }
        30% {
          transform: translateX(-100px) translateY(-15px) rotate(-45deg)
            scale(0.9);
        }
        50% {
          transform: translateX(-200px) translateY(-25px) rotate(-90deg)
            scale(1);
        }
        70% {
          transform: translateX(-300px) translateY(-15px) rotate(-135deg)
            scale(0.9);
        }
        90% {
          opacity: 0.4;
        }
        100% {
          opacity: 0;
          transform: translateX(-400px) translateY(0) rotate(-180deg) scale(0.8);
        }
      }

      @keyframes leaf-float-down {
        0% {
          opacity: 0;
          transform: translateX(0) translateY(0) rotate(0deg) scale(0.8);
        }
        10% {
          opacity: 0.4;
        }
        30% {
          transform: translateX(-15px) translateY(80px) rotate(45deg) scale(0.9);
        }
        50% {
          transform: translateX(15px) translateY(160px) rotate(90deg) scale(1);
        }
        70% {
          transform: translateX(-10px) translateY(240px) rotate(135deg)
            scale(0.9);
        }
        90% {
          opacity: 0.4;
        }
        100% {
          opacity: 0;
          transform: translateX(0) translateY(320px) rotate(180deg) scale(0.8);
        }
      }

      @keyframes leaf-float-up {
        0% {
          opacity: 0;
          transform: translateX(0) translateY(0) rotate(0deg) scale(0.8);
        }
        10% {
          opacity: 0.4;
        }
        30% {
          transform: translateX(15px) translateY(-80px) rotate(-45deg)
            scale(0.9);
        }
        50% {
          transform: translateX(-15px) translateY(-160px) rotate(-90deg)
            scale(1);
        }
        70% {
          transform: translateX(10px) translateY(-240px) rotate(-135deg)
            scale(0.9);
        }
        90% {
          opacity: 0.4;
        }
        100% {
          opacity: 0;
          transform: translateX(0) translateY(-320px) rotate(-180deg) scale(0.8);
        }
      }
    `,
  ],
  template: `
    @if (isLoading()) {
      <div class="py-16 bg-white/50 border-t border-cyan-200">
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
          <div class="mt-20 team-grid-container">
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
        class="py-16 bg-white/50 border-t border-cyan-200 overflow-hidden relative"
      >
        <!-- Efecto de hojas flotantes para la sección de equipo -->
        <div class="wind-effect-wrapper-team">
          <div class="leaf leaf-1">🍃</div>
          <div class="leaf leaf-2">🍃</div>
          <div class="leaf leaf-3">🍃</div>
          <div class="leaf leaf-4">🍃</div>
          <div class="leaf leaf-5">🍃</div>
          <div class="leaf leaf-6">🍃</div>
          <div class="leaf leaf-7">🍃</div>
          <div class="leaf leaf-8">🍃</div>
          <div class="leaf leaf-9">🍃</div>
          <div class="leaf leaf-10">🍃</div>
          <div class="leaf leaf-11">🍃</div>
          <div class="leaf leaf-12">🍃</div>
          <div class="leaf leaf-13">🍃</div>
          <div class="leaf leaf-14">🍃</div>
          <div class="leaf leaf-15">🍃</div>
          <div class="leaf leaf-16">🍃</div>
          <div class="leaf leaf-17">🍃</div>
          <div class="leaf leaf-18">🍃</div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="text-center">
            <h2
              class="inline-block text-sm font-bold text-cyan-700 tracking-wider uppercase bg-gradient-to-r from-cyan-100 to-cyan-50 px-4 py-2 rounded-full border border-cyan-200"
              appScrollReveal
              [revealAnimation]="'slide-up'"
              [revealDelay]="0"
            >
              {{ 'about.team.title' | transloco }}
            </h2>
            <p
              class="mt-4 text-3xl font-extrabold text-cyan-600 sm:text-4xl drop-shadow-sm"
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

          <div class="mt-20 team-grid-container">
            @for (
              manager of managerData();
              track trackByFn($index, manager);
              let i = $index
            ) {
              <div
                class="group relative text-center transform transition-all duration-300 hover:-translate-y-2 mt-4 cursor-pointer"
                appScrollReveal
                [revealAnimation]="'slide-up'"
                [revealDelay]="i * 100"
              >
                <div
                  class="relative mx-auto h-56 w-56 rounded-full overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-4 ring-cyan-100 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] group-hover:ring-cyan-300 transition-all duration-300"
                  appBorderBeam
                  [beamColor]="'rgba(6, 182, 212, 0.7)'"
                  [beamWidth]="'3px'"
                  [beamDuration]="'5s'"
                  [beamDelay]="i * 0.6 + 's'"
                >
                  <img
                    [src]="getImageUrl(manager.imageUrl)"
                    (error)="handleImageError($event)"
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    [alt]="manager.title"
                    loading="lazy"
                  />

                  <div
                    class="absolute inset-0 bg-gradient-to-t from-cyan-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  ></div>
                </div>

                <div class="mt-2">
                  <div class="flex items-center justify-center gap-2">
                    <h3
                      class="text-xl font-semibold text-cyan-700 transition-colors duration-300 group-hover:text-cyan-800"
                    >
                      {{ manager.title }}
                    </h3>

                    @if (
                      manager.imageUrl && !isUsingDefault(manager.imageUrl)
                    ) {
                      <button
                        (click)="
                          onZoom.emit({
                            url: manager.imageUrl,
                            title: manager.title,
                          })
                        "
                        class="flex items-center justify-center bg-cyan-500 text-white p-1.5 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2.5"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </button>
                    }
                  </div>
                  <div
                    class="mt-1 inline-block px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium transition-colors duration-300 group-hover:bg-cyan-200"
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
    imgElement.src = this.aboutState.getDefaultImageUrl();
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
    BorderBeamDirective,
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
    imgElement.src = this.DEFAULT_IMAGE;
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
