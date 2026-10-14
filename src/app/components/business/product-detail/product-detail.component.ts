import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslocoModule } from '@jsverse/transloco';
import { HomeStateService } from '../../../shared/services/features/home-state.service';
import { ImageUrlService } from '../../../shared/services/system/image-url.service';
import { ProductData } from '../../../shared/interfaces/productData.interface';

interface ProductMedia {
  url: string;
  type: 'image' | 'video';
  title: string;
}

interface DescriptionBlock {
  heading: string | null;
  body: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule],
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly homeState = inject(HomeStateService);
  private readonly imageUrls = inject(ImageUrlService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly DEFAULT_IMAGE = this.imageUrls.defaultImage('content');

  readonly productId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: NaN },
  );

  readonly products = this.homeState.products$;
  readonly isLoading = computed(
    () =>
      this.homeState.isProductsLoading$() &&
      !this.homeState.isProductsDataReady$(),
  );

  readonly product = computed<ProductData | null>(
    () => this.products().find((p) => p.id === this.productId()) ?? null,
  );

  readonly media = computed<ProductMedia[]>(() => {
    const product = this.product();
    if (!product) return [];

    if (product.files && product.files.length > 0) {
      return product.files.map((file) => ({
        url: this.imageUrls.image(file.media),
        type: this.isVideoFile(file.media) ? 'video' : 'image',
        title: file.title || product.title,
      }));
    }

    return [
      {
        url: product.imageUrl || this.DEFAULT_IMAGE,
        type: this.isVideoFile(product.imageUrl) ? 'video' : 'image',
        title: product.title,
      },
    ];
  });

  readonly activeMediaIndex = signal(0);
  readonly activeMedia = computed<ProductMedia | null>(
    () => this.media()[this.activeMediaIndex()] ?? this.media()[0] ?? null,
  );

  readonly selectedVariantIndex = signal(0);
  readonly selectedVariant = computed(() => {
    const variants = this.product()?.variants ?? [];
    return variants[this.selectedVariantIndex()] ?? variants[0] ?? null;
  });

  readonly minPrice = computed(() => {
    const variants = this.product()?.variants ?? [];
    return variants.length ? Math.min(...variants.map((v) => v.price)) : null;
  });

  /** Divide la descripción en bloques usando "|" como separador. */
  readonly descriptionBlocks = computed<DescriptionBlock[]>(() => {
    const description = this.product()?.description?.trim();
    if (!description) return [];

    return description
      .split(/\r?\n\s*\|\s*\r?\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const [firstLine, ...rest] = block.split(/\r?\n/);
        const isHeading = /:\s*$/.test(firstLine) && rest.length > 0;
        return isHeading
          ? {
              heading: firstLine.replace(/:\s*$/, ''),
              body: rest.join('\n').trim(),
            }
          : { heading: null, body: block };
      });
  });

  readonly related = computed(() => {
    const product = this.product();
    if (!product) return [];
    const category = this.getCategoryTitle(product.category);
    const others = this.products().filter((p) => p.id !== product.id);
    const sameCategory = others.filter(
      (p) => this.getCategoryTitle(p.category) === category,
    );
    const rest = others.filter(
      (p) => this.getCategoryTitle(p.category) !== category,
    );
    return [...sameCategory, ...rest].slice(0, 3);
  });

  constructor() {
    if (this.isBrowser) {
      this.homeState.loadIfNeeded();
    }

    // Reinicia la galería y la opción al cambiar de producto
    effect(() => {
      this.productId();
      this.activeMediaIndex.set(0);
      this.selectedVariantIndex.set(0);
      if (this.isBrowser) {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    });
  }

  selectMedia(index: number): void {
    this.activeMediaIndex.set(index);
  }

  nextMedia(): void {
    const total = this.media().length;
    if (total > 1) this.activeMediaIndex.update((i) => (i + 1) % total);
  }

  prevMedia(): void {
    const total = this.media().length;
    if (total > 1) this.activeMediaIndex.update((i) => (i - 1 + total) % total);
  }

  selectVariant(index: number): void {
    this.selectedVariantIndex.set(index);
  }

  getCategoryTitle(category: unknown): string {
    if (typeof category === 'string') return category;
    return (category as { title?: string } | null)?.title ?? '';
  }

  getCardImageUrl(product: ProductData): string {
    return product.imageUrl || this.DEFAULT_IMAGE;
  }

  getMinPrice(product: ProductData): number | null {
    const variants = product.variants ?? [];
    return variants.length ? Math.min(...variants.map((v) => v.price)) : null;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('img_default.webp')) {
      img.src = this.DEFAULT_IMAGE;
    }
  }

  private isVideoFile(name: string | null | undefined): boolean {
    return !!name && /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(name);
  }
}
