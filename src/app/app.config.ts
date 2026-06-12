import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import { environment } from '../environments/environment';
import { MetricsService } from './shared/services/system/metrics.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const metricsSrv = inject(MetricsService);
      if (metricsSrv.hasTrackedVisit()) return;
      metricsSrv.incrementMetric('site_visits').subscribe({
        next: () => metricsSrv.markVisitTracked(),
        error: () => {},
      });
    }),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'es'],
        defaultLang: environment.defaultLanguage,
        fallbackLang: environment.defaultLanguage,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
