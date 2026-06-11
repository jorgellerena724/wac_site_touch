import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  afterNextRender,
  effect,
  Injector,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  ContactData,
  SocialNetwork,
} from '../../../shared/interfaces/contactData.interface';
import { TranslocoModule } from '@jsverse/transloco';
import { ContactStateService } from '../../../shared/services/features/contact-state.service';
import { HeaderService } from '../../../shared/services/features/header.service';
import { getSocialNetworkConfig } from '../../../shared/constants/social-networks';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  // Señales de animación
  readonly isHeaderLoaded = signal(false);
  readonly isContactInfoLoaded = signal(false);
  readonly logoError = signal(false);
  readonly contactEmptyIconLoaded = signal(false);
  readonly contactEmptyTextLoaded = signal(false);

  // Servicios
  private readonly contactState = inject(ContactStateService);
  private readonly headerService = inject(HeaderService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Computed properties
  readonly contactData = computed(() => {
    const data = this.contactState.contact$();
    return data.length > 0 ? data[0] : this.defaultContactData;
  });

  // Header data para obtener el logo y nombre de la empresa
  readonly headerData = computed(() => this.headerService.headerData());

  readonly logoUrl = computed(() => {
    const header = this.headerData();
    if (!header?.logo) return '';
    return this.headerService.getImageUrl(header.logo);
  });

  readonly companyName = computed(() => {
    const header = this.headerData();
    return header?.name || 'Empresa';
  });

  // Solo muestra redes sociales activas
  readonly activeSocialNetworks = computed(() => {
    const socialNetworks = this.contactData().social_networks || [];
    return socialNetworks.filter((network) => network.active);
  });

  readonly isLoading = computed(() => this.contactState.isContactLoading$());

  readonly isAddressValid = computed(() => {
    const address = this.contactData().address;
    return address && address !== '...' && address.trim() !== '';
  });

  readonly isEmailValid = computed(() => {
    const email = this.contactData().email;
    return email && email !== '...' && email.trim() !== '';
  });

  readonly hasAnyContactInfo = computed(() => {
    return (
      this.isAddressValid() ||
      this.isEmailValid() ||
      this.activeSocialNetworks().length > 0
    );
  });

  private defaultContactData: ContactData = {
    id: 0,
    address: '...',
    email: '...',
    social_networks: [],
  };

  constructor() {
    // Cargar datos de contacto y header
    this.contactState.loadContactData();
    this.headerService.loadHeaderData();

    // Trigger animaciones después de renderizar
    if (this.isBrowser) {
      afterNextRender(() => {
        this.startAnimationSequence();
      });
    }

    effect(() => {}, { injector: this.injector });
  }

  // ===== ANIMACIONES =====
  private startAnimationSequence(): void {
    if (!this.isBrowser) return;

    // Animación del header
    this.scheduleAnimation(100, () => {
      this.isHeaderLoaded.set(true);
    });

    // Animación del contenedor de información
    this.scheduleAnimation(300, () => {
      this.isContactInfoLoaded.set(true);
    });

    // Animaciones del estado vacío (solo si no hay información de contacto)
    this.scheduleAnimation(100, () => {
      this.contactEmptyIconLoaded.set(true);
    });

    this.scheduleAnimation(300, () => {
      this.contactEmptyTextLoaded.set(true);
    });
  }

  private scheduleAnimation(delay: number, callback: () => void): void {
    if (!this.isBrowser) return;

    setTimeout(callback, delay);
  }

  openEmail(): void {
    if (this.contactData().email && this.contactData().email !== '...') {
      const mailtoUrl = `mailto:${this.contactData().email}`;
      window.open(mailtoUrl, '_self');
    }
  }

  openSocialNetwork(network: SocialNetwork): void {
    if (network.url && network.username) {
      const url = network.url + network.username;
      window.open(url, '_blank');
    }
  }

  getSocialNetworkIcon(network: string): SafeHtml {
    const config = getSocialNetworkConfig(network);
    return this.sanitizer.bypassSecurityTrustHtml(config.icon);
  }

  // Ahora devuelve la clave de traducción en lugar del texto estático
  getSocialNetworkLabel(network: string): string {
    const config = getSocialNetworkConfig(network);
    return config.label;
  }

  getSocialNetworkHint(network: string): string {
    const config = getSocialNetworkConfig(network);
    return config.hintKey;
  }

  getSocialNetworkColor(network: string): string {
    return getSocialNetworkConfig(network).color;
  }

  getSocialNetworkBackgroundColor(network: string): string {
    const color = this.getSocialNetworkColor(network);
    // Convierte hex a rgba con opacidad 0.1 (20% de opacidad)
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  }

  openGoogleMaps(): void {
    if (this.contactData().address && this.contactData().address !== '...') {
      const encodedAddress = encodeURIComponent(this.contactData().address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    }
  }

  openWhatsApp(): void {
    // Buscar WhatsApp en las redes sociales activas y reutilizar openSocialNetwork
    const whatsappNetwork = this.activeSocialNetworks().find(
      (network) => network.network.toLowerCase() === 'whatsapp',
    );

    if (whatsappNetwork) {
      this.openSocialNetwork(whatsappNetwork);
    }
  }

  onLogoError(): void {
    this.logoError.set(true);
  }

  // ===== MÉTODOS PARA EL ESTADO VACÍO =====
  isContactEmptyIconLoaded(): boolean {
    return this.contactEmptyIconLoaded();
  }

  isContactEmptyTextLoaded(): boolean {
    return this.contactEmptyTextLoaded();
  }
}
