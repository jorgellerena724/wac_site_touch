// metrics-initializer.ts
import { inject } from '@angular/core';
import { MetricsService } from './metrics.service';

const SESSION_KEY = 'visit_tracked';

export function metricsInitializer() {
  const metricsSrv = inject(MetricsService);

  return () => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    metricsSrv.incrementMetric('site_visits').subscribe({
      next: () => sessionStorage.setItem(SESSION_KEY, '1'),
      error: () => {},
    });
  };
}
