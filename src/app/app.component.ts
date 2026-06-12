import {
  Component,
  OnInit,
  OnDestroy,
  viewChild,
  ChangeDetectionStrategy,
  signal,
  inject,
  PLATFORM_ID,
  effect,
  afterNextRender,
  Injector,
} from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { NavbarComponent } from './components/business/navbar/navbar.component';
import { FooterComponent } from './components/business/footer/footer.component';
import { NotificationComponent } from './shared/components/app-notification/app-notification.component';
import { TranslocoModule } from '@jsverse/transloco';
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget.component';
import { ModalComponent } from './shared/components/app-modal/app-modal.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    NotificationComponent,
    TranslocoModule,
    ChatWidgetComponent,
    ModalComponent,
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  // Inyección moderna sin @Inject
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  // ViewChild moderna con signal
  readonly chatWidget =
    viewChild.required<ChatWidgetComponent>('chatWidgetComp');

  // Signals para el estado
  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly currentRoute = signal('');
  readonly showUpdateNotification = signal(false);

  // Convertir el observable de navegación a signal
  private readonly navigationEnd$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects),
  );

  private readonly currentUrl = toSignal(this.navigationEnd$, {
    initialValue: this.router.url,
  });

  constructor() {
    if (this.isBrowser) {
      afterNextRender(
        () => {
          // Verificar actualizaciones al cargar la app
          this.checkForUpdates();

          // Verificar cuando el usuario vuelve a la pestaña
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
              this.checkForUpdates();
            }
          });
        },
        { injector: this.injector },
      );
    }

    // Effect para manejar cambios de ruta
    effect(() => {
      this.setInitialRoute();
    });

    effect(() => {
      const url = this.currentUrl();
      if (url) {
        this.handleRouteChange(url);
        // Verificar actualizaciones en cada cambio de ruta
        if (this.isBrowser) {
          this.checkForUpdates();
        }
      }
    });
  }

  private handleRouteChange(url: string): void {
    const segments = url.split('/');
    const newRoute = segments[1] || 'home';

    if (this.currentRoute() !== newRoute) {
      this.currentRoute.set(newRoute);

      // Scroll inmediato en cambio de ruta
      if (this.isBrowser) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  }

  private setInitialRoute(): void {
    const segments = this.router.url.split('/');
    this.currentRoute.set(segments[1] || 'home');
  }

  scrollToTop(): void {
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  // Método para toggle del chat (opcional, para usar en el template)
  toggleChat(): void {
    this.chatWidget().toggleChat();
  }

  // Computed signal para el estado del chat
  get isChatOpen() {
    return this.chatWidget()?.isChatOpen() ?? false;
  }

  // Verificar si hay una nueva versión disponible
  private checkForUpdates(): void {
    if (!this.isBrowser) return;

    const storedTs = localStorage.getItem('app-build-ts');
    const currentTs = environment.BUILD_TS;

    if (!currentTs) return;

    // Primera visita: guardar y salir
    if (!storedTs) {
      localStorage.setItem('app-build-ts', String(currentTs));
      return;
    }

    // Si el timestamp actual es diferente al guardado → nueva versión
    if (String(currentTs) !== storedTs) {
      this.showUpdateNotification.set(true);
    }
  }

  // Recargar la aplicación para obtener la nueva versión
  reloadApp(): void {
    if (!this.isBrowser) return;

    // Guardar el timestamp actual para no mostrar la notificación de nuevo
    localStorage.setItem('app-build-ts', String(environment.BUILD_TS));

    // Limpiar el cache del service worker si existe
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }

    // Limpiar cache del navegador y recargar
    caches?.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });

    // Ocultar la notificación
    this.showUpdateNotification.set(false);

    // Recargar forzando desde el servidor
    window.location.reload();
  }
}
