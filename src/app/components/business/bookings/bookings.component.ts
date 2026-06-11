import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { HomeStateService } from '../../../shared/services/features/home-state.service';
import { ProductData } from '../../../shared/interfaces/productData.interface';
import { CalcomComponent } from '../../../shared/components/app-calcom/app-calcom.component';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    CalcomComponent,
    ScrollRevealDirective,
  ],
  templateUrl: './bookings.component.html',
})
export class BookingsComponent implements OnInit {
  private readonly homeStateService = inject(HomeStateService);

  // Signals para el estado
  readonly showCalcom = signal(false);
  readonly selectedService = signal<ProductData | null>(null);
  readonly selectedVariant = signal<any>(null);

  // Signals para animaciones del estado vacío
  private readonly noDataIconLoaded = signal(false);
  private readonly noDataTextLoaded = signal(false);

  // Computed signals
  readonly products$ = computed(() => this.homeStateService.products$());
  readonly isLoading$ = computed(() =>
    this.homeStateService.isProductsLoading$(),
  );

  ngOnInit() {
    // Cargar productos si no están cargados
    this.homeStateService.loadIfNeeded();

    // Inicializar animaciones del estado vacío con delay
    setTimeout(() => {
      this.noDataIconLoaded.set(true);
    }, 100);

    setTimeout(() => {
      this.noDataTextLoaded.set(true);
    }, 300);
  }

  // Métodos para las animaciones del estado vacío
  isNoDataIconLoaded(): boolean {
    return this.noDataIconLoaded();
  }

  isNoDataTextLoaded(): boolean {
    return this.noDataTextLoaded();
  }

  bookNow(product: ProductData, variant?: any) {
    this.selectedService.set(product);
    this.selectedVariant.set(variant || product.variants?.[0] || null);
    this.showCalcom.set(true);
  }

  goBack() {
    this.showCalcom.set(false);
    this.selectedService.set(null);
    this.selectedVariant.set(null);
  }

  trackByProduct(index: number, product: ProductData): number {
    return product.id;
  }

  trackByVariant(index: number, variant: any): string {
    return variant.id || variant.description || index.toString();
  }
}
