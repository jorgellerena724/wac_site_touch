import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderService } from '../../../shared/services/features/header.service';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';

// Interfaz para los idiomas disponibles
interface LanguageOption {
  code: string;
  name: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, TranslocoModule],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  // Servicios
  private readonly router = inject(Router);
  private readonly headerService = inject(HeaderService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  // Usar directamente las señales del servicio
  readonly headerData = this.headerService.headerData;
  readonly isLoading = this.headerService.isLoading;
  readonly hasError = this.headerService.hasError;

  // Lista de idiomas disponibles
  readonly availableLanguages = signal<LanguageOption[]>([
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
  ]);

  // Estado de la UI
  readonly mobileMenuOpen = signal(false);
  readonly languageMenuOpen = signal(false);
  readonly currentRoute = signal('');
  readonly currentSubRoute = signal('');
  readonly logoLoading = signal(false);
  readonly logoError = signal(false);

  // Configuración de idiomas
  readonly currentLanguageCode = signal<string>('es');

  // Computed values
  readonly currentLanguage = computed(() => {
    const code = this.currentLanguageCode();
    const lang = this.availableLanguages().find((l) => l.code === code);
    return lang?.name || 'Español';
  });

  // Flag para saber si estamos en el navegador
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    // Configurar listener de rutas
    this.setupRouterListener();

    // Sincronizar con Transloco
    this.setupTranslocoListener();

    effect(() => {
      this.headerService.loadHeaderData();
    });

    // Efecto para manejar cambios en los datos del header
    effect(() => {
      const data = this.headerData();
      if (data?.logo) {
        this.loadLogoImage(data.logo);
        this.updateFavicon(data.logo);
      }
    });

    // Efecto para cerrar menús al cambiar ruta
    effect(() => {
      const route = this.currentRoute();
      if (route) {
        this.mobileMenuOpen.set(false);
        this.languageMenuOpen.set(false);
      }
    });

    // Cargar idioma guardado
    if (this.isBrowser) {
      const savedLang = localStorage.getItem('selectedLang');
      if (
        savedLang &&
        this.availableLanguages().some((l) => l.code === savedLang)
      ) {
        this.currentLanguageCode.set(savedLang);
        this.transloco.setActiveLang(savedLang);
      }
    }
  }

  private setupRouterListener(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        const segments = event.url.split('/');
        this.currentRoute.set(segments[1] || '');
        this.currentSubRoute.set(segments.length > 2 ? segments[2] : '');
      });
  }

  private setupTranslocoListener(): void {
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => {
        this.currentLanguageCode.set(lang);
      });
  }

  private loadLogoImage(logoName: string): void {
    if (this.isBrowser) {
      if (!logoName?.trim()) {
        this.logoError.set(true);
        return;
      }

      this.logoLoading.set(true);
      this.logoError.set(false);

      try {
        const imageUrl = this.headerService.getImageUrl(logoName);

        // Crear una imagen en memoria para precargar y verificar
        const img = new Image();
        img.src = imageUrl;

        img.onload = () => {
          this.logoLoading.set(false);
        };

        img.onerror = () => {
          console.warn(`Logo no encontrado: ${imageUrl}`);
          this.logoError.set(true);
          this.logoLoading.set(false);
        };
      } catch (error) {
        console.error('Error al cargar el logo:', error);
        this.logoError.set(true);
        this.logoLoading.set(false);
      }
    }
  }

  // Helper para obtener rutas de imágenes consistentes
  getImagePath(filename: string): string {
    if (!filename) return '';

    // Asegurar que siempre tengamos la ruta correcta
    const basePath = environment.imgPath || 'assets/img/';
    const cleanPath = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const cleanFilename = filename.startsWith('/')
      ? filename.slice(1)
      : filename;

    return `${cleanPath}${cleanFilename}`;
  }

  // Computed para la URL del logo
  readonly logoUrl = computed(() => {
    const data = this.headerData();
    if (!data?.logo) return '';

    return this.headerService.getImageUrl(data.logo);
  });

  // Computed para determinar si mostrar el logo
  readonly showLogo = computed(() => {
    const url = this.logoUrl();
    const loading = this.logoLoading();
    const error = this.logoError();

    return !loading && !error && url !== '';
  });

  // Métodos públicos
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  toggleLanguageMenu(): void {
    this.languageMenuOpen.update((open) => !open);
  }

  isActive(route: string): boolean {
    if (route === 'home') {
      return this.currentRoute() === '' || this.currentRoute() === 'home';
    }
    return this.currentRoute() === route;
  }

  scrollToTop(): void {
    if (this.isBrowser) {
      const navbarElement = document.getElementById('navbar');
      if (navbarElement) {
        navbarElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  closeMenus(): void {
    this.mobileMenuOpen.set(false);
    this.languageMenuOpen.set(false);
  }

  navigateToHome(): void {
    this.scrollToTop();
    this.router.navigate(['/home']);
  }

  selectLanguage(lang: string): void {
    if (!this.availableLanguages().some((l) => l.code === lang)) {
      console.warn(`Idioma no soportado: ${lang}`);
      return;
    }

    this.currentLanguageCode.set(lang);
    this.transloco.setActiveLang(lang);

    if (this.isBrowser) {
      try {
        localStorage.setItem('selectedLang', lang);
      } catch (error) {
        console.warn('No se pudo guardar idioma en localStorage:', error);
      }
    }

    this.languageMenuOpen.set(false);
  }

  // Recargar datos del header
  reloadHeaderData(): void {
    this.headerService.loadHeaderData();
  }

  private updateFavicon(logoName: string | null | undefined): void {
    if (!this.isBrowser) return;

    try {
      if (logoName?.trim()) {
        const faviconUrl = this.headerService.getImageUrl(logoName);
        this.setFavicon(faviconUrl);
      } else {
        this.setDefaultFavicon();
      }
    } catch (error) {
      console.error('Error al actualizar favicon:', error);
      this.setDefaultFavicon();
    }
  }

  private setDefaultFavicon(): void {
    if (!this.isBrowser) return;

    const defaultFaviconPath = 'favicon.ico';
    const cacheBuster = `?v=${Date.now()}`;
    const fullUrl = `${defaultFaviconPath}${cacheBuster}`;

    let link: HTMLLinkElement | null =
      document.querySelector("link[rel~='icon']");
    if (link) {
      if (link.href !== fullUrl) {
        link.href = fullUrl;
        console.log('Favicon por defecto establecido');
      }
    } else {
      link = document.createElement('link');
      link.rel = 'icon';
      link.href = fullUrl;
      document.head.appendChild(link);
      console.log('Favicon por defecto creado');
    }
  }

  private setFavicon(url: string): void {
    if (!this.isBrowser) return;

    // Cache busting para evitar problemas de caché del navegador
    const cacheBuster = `?v=${Date.now()}`;
    const fullUrl = url.includes('?')
      ? `${url}&${cacheBuster.slice(1)}`
      : `${url}${cacheBuster}`;

    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    // Solo actualizar si la URL es diferente
    if (link.href !== fullUrl) {
      link.href = fullUrl;
    }
  }
}
