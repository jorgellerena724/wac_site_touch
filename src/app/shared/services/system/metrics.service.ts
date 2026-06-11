// metrics.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const SESSION_KEY = 'visit_tracked';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private base = `${environment.api}metrics`;

  incrementMetric(eventName: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });

    return this.http.patch(
      `${this.base}/update-metric/${eventName}/`,
      {},
      { headers },
    );
  }

  hasTrackedVisit(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true; // en SSR no trackear
    return !!sessionStorage.getItem(SESSION_KEY);
  }

  markVisitTracked(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
  }
}
