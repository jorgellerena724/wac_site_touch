import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

interface SeoData {
  title: string;
  description: string;
}

const ROUTE_SEO: Record<string, SeoData> = {
  home: {
    title: 'Travel Agency | Your next adventure awaits.',
    description:
      'Discover unforgettable travel experiences with our expert travel agency. Book your next adventure today!',
  },
  about: {
    title: 'About Us | Travel Agency',
    description:
      'Learn about our travel agency and our passion for creating unforgettable travel experiences for our clients.',
  },
  contact: {
    title: 'Contact Us | Travel Agency',
    description:
      'Get in touch with our travel agency to book your next adventure or ask questions about our services.',
  },
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly isBrowser = isPlatformBrowser(this.platformId);

  updateForRoute(route: string): void {
    const routeKey = route || 'home';
    const seo = ROUTE_SEO[routeKey] || ROUTE_SEO['home'];

    this.titleService.setTitle(seo.title);

    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    if (this.isBrowser) {
      const canonicalPath = routeKey === 'home' ? '/' : `/${routeKey}`;
      let linkEl = document.querySelector('link[rel="canonical"]');
      if (linkEl) {
        linkEl.setAttribute('href', canonicalPath);
      } else {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = canonicalPath;
        document.head.appendChild(link);
      }
    }
  }
}
