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
import { SeoService } from './shared/services/system/seo.service';

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
  private readonly seoService = inject(SeoService);

  // ViewChild moderna con signal
  // Opcional: el widget vive dentro de un @defer y no existe hasta el primer click
  readonly chatWidget = viewChild<ChatWidgetComponent>('chatWidgetComp');
  readonly chatRequested = signal(false);
  private pendingChatToggle = false;

  // Signals para el estado
  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly currentRoute = signal('');

  // Convertir el observable de navegación a signal
  private readonly navigationEnd$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects),
  );

  private readonly currentUrl = toSignal(this.navigationEnd$, {
    initialValue: this.router.url,
  });

  constructor() {
    // Abrir el chat en cuanto el bloque @defer termine de montar el widget
    effect(() => {
      const widget = this.chatWidget();
      if (widget && this.pendingChatToggle) {
        this.pendingChatToggle = false;
        widget.toggleChat();
      }
    });

    // Effect para manejar cambios de ruta
    effect(() => {
      this.setInitialRoute();
    });

    effect(() => {
      const url = this.currentUrl();
      if (url) {
        this.handleRouteChange(url);
      }
    });

    effect(() => {
      const url = this.currentUrl();
      if (url) {
        const segments = url.split('/');
        const route = segments[1] || 'home';
        this.seoService.updateForRoute(route);
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
    const widget = this.chatWidget();
    if (widget) {
      widget.toggleChat();
      return;
    }
    this.pendingChatToggle = true;
    this.chatRequested.set(true);
  }

  // Computed signal para el estado del chat
  get isChatOpen() {
    return this.chatWidget()?.isChatOpen() ?? false;
  }
}
