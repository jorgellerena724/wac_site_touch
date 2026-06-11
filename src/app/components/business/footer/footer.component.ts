import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { HeaderService } from '../../../shared/services/features/header.service';
import { TranslocoModule } from '@jsverse/transloco';
import { ContactStateService } from '../../../shared/services/features/contact-state.service';
import {
  ContactData,
  SocialNetwork,
} from '../../../shared/interfaces/contactData.interface';
import { getSocialNetworkConfig } from '../../../shared/constants/social-networks';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, TranslocoModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  currentRoute = '';
  companyName: string = '';

  private contactState = inject(ContactStateService);
  private sanitizer = inject(DomSanitizer);
  private defaultContactData: ContactData = {
    id: 0,
    address: '...',
    email: '...',
    social_networks: [],
  };

  contactData = computed(() => {
    const data = this.contactState.contact$();
    return data.length > 0 ? data[0] : this.defaultContactData;
  });
  isAddressAvailable = computed(() => {
    const address = this.contactData().address;
    return address && address !== this.defaultContactData.address;
  });

  activeSocialNetworks = computed(() => {
    const socialNetworks = this.contactData().social_networks || [];
    return socialNetworks.filter((network) => network.active);
  });

  hasContactInfo = computed(() => {
    const email = this.contactData().email;
    const address = this.contactData().address;
    return (email && email !== '...') || (address && address !== '...');
  });

  hasSocialNetworks = computed(() => {
    return this.activeSocialNetworks().length > 0;
  });

  constructor(
    private router: Router,
    private headerService: HeaderService,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const segments = this.router.url.split('/');
        this.currentRoute = segments[1] || 'home';
      });
  }

  ngOnInit() {
    this.contactState.loadContactData();
    this.headerService.headerData$.subscribe((data) => {
      if (data) {
        this.companyName = data.name;
      }
    });
  }

  scrollToTop() {
    const navbarElement = document.getElementById('navbar');
    if (navbarElement) {
      navbarElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openGoogleMaps(): void {
    if (this.isAddressAvailable()) {
      const address = this.contactData().address;
      const encodedAddress = encodeURIComponent(address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
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

  getSocialNetworkColor(network: string): string {
    return getSocialNetworkConfig(network).color;
  }

  getSocialNetworkLabel(network: string): string {
    return getSocialNetworkConfig(network).label;
  }
}
