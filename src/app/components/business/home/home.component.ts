import {
  Component,
  ElementRef,
  PLATFORM_ID,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  viewChild,
  afterNextRender,
  Injector,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HomeData } from '../../../shared/interfaces/homeData.interface';
import {
  ProductData,
  ProductVariant,
  ProductImage,
} from '../../../shared/interfaces/productData.interface';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { HomeStateService } from '../../../shared/services/features/home-state.service';
import { ReviewService } from '../../../shared/services/features/review.service';
import { ModalService } from '../../../shared/services/system/modal.service';
import { NotificationService } from '../../../shared/services/system/notification.service';
import { environment } from '../../../../environments/environment';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { BorderBeamDirective } from '../../../shared/directives/border-beam.directive';
import EmblaCarousel from 'embla-carousel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    TranslocoModule,
    ScrollRevealDirective,
    BorderBeamDirective,
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  // ===== INYECCIONES =====
  private readonly homeState = inject(HomeStateService);
  private readonly reviewService = inject(ReviewService);
  private readonly modalService = inject(ModalService);
  private readonly notificationService = inject(NotificationService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ===== CONSTANTES =====
  private readonly SCROLL_AMOUNT = 300;
  private readonly DEFAULT_IMAGE = `${environment.imgPath}img_default.webp`;

  // ===== SIGNALS DEL CARRUSEL (HOME) =====
  readonly carouselData = this.homeState.carouselWithImages$;
  readonly productsAnimationClass = signal('');
  readonly currentSlide = signal(0);
  readonly showCarouselSkeleton = signal(true);

  // ===== SIGNALS DE RESEÑAS =====
  readonly reviewsData = signal<HomeData[]>([]);
  readonly isReviewsLoading = signal(false);
  readonly currentReviewSlide = signal(0);
  readonly showReviewsSkeleton = signal(true);
  readonly averageRating = computed(() => {
    const reviews = this.reviewsData();
    if (reviews.length === 0) return 0;
    const ratings = reviews
      .filter((r) => r.star_rating)
      .map((r) => r.star_rating!);
    if (ratings.length === 0) return 0;
    return (
      Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
      10
    );
  });
  readonly reviewsCount = computed(() => this.reviewsData().length);

  // ===== SIGNALS DE PRODUCTOS =====
  readonly productsData = this.homeState.products$;
  readonly categoriesData = this.homeState.categories$;
  readonly isProductsLoading = this.homeState.isProductsLoading$;
  readonly isCategoriesLoading = this.homeState.isCategoriesLoading$;
  readonly isProductsDataReady = this.homeState.isProductsDataReady$;
  readonly isCategoriesDataReady = this.homeState.isCategoriesDataReady$;

  // ===== SEÃñALES COMPUTADAS PARA ESTADO =====
  readonly isLoading = computed(
    () => this.isProductsLoading() || this.isCategoriesLoading(),
  );

  readonly allDataReady = computed(
    () => this.isProductsDataReady() && this.isCategoriesDataReady(),
  );

  readonly hasProducts = computed(() => this.productsData().length > 0);
  readonly hasCategories = computed(() => this.categoriesData().length > 0);

  // ===== SEÃñALES DE UI (PRODUCTOS) =====
  readonly isHeaderLoaded = signal(false);
  readonly isFiltersLoaded = signal(false);
  readonly isProductsGridLoaded = signal(false);
  readonly isNoDataLoaded = signal(false);
  readonly isNoDataIconLoaded = signal(false);
  readonly isNoDataTextLoaded = signal(false);

  readonly selectedCategory = signal<string>('Todos');
  readonly selectedProduct = signal<ProductData | null>(null);
  readonly showNoDataMessage = signal(false);
  readonly isProductTitleExpanded = signal(false);

  // ===== SEÃñALES DE SCROLL (PRODUCTOS) =====
  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(false);
  readonly canScrollVariantsLeft = signal(false);
  readonly canScrollVariantsRight = signal(false);

  // ===== REFERENCIAS DE VIEW =====
  readonly categoryScroller =
    viewChild<ElementRef<HTMLDivElement>>('categoryScroller');
  readonly variantScroller =
    viewChild<ElementRef<HTMLDivElement>>('variantScroller');
  readonly carouselSection = viewChild<ElementRef>('carouselSection');
  readonly productsSection = viewChild<ElementRef>('productsSection');
  readonly emblaViewport =
    viewChild<ElementRef<HTMLDivElement>>('emblaViewport');

  // ===== SEÃñALES DE VARIANTES =====
  readonly selectedVariant = signal<ProductVariant | null>(null);
  readonly selectedVariantIndex = signal<number>(0);

  // ===== SEÑALES DE VARIANTES PARA CARDS =====
  readonly cardSelectedVariants = signal<Map<string | number, number>>(
    new Map(),
  );

  // ===== SEÑALES DE EMBLA (CARRUSEL DE PRODUCTOS) =====
  readonly emblaSelectedSnap = signal(0);
  readonly emblaSnapCount = signal(0);
  readonly emblaCanScrollPrev = signal(false);
  readonly emblaCanScrollNext = signal(false);
  private emblaApi: ReturnType<typeof EmblaCarousel> | null = null;

  // ===== SEÃñALES DE IMÃGENES =====
  readonly currentImageIndex = signal(0);
  readonly productImages = signal<ProductImage[]>([]);
  readonly currentImageUrl = signal<string>('');

  // ===== SEÃñALES DE MODALES =====
  readonly showMediaZoom = signal(false);
  readonly zoomedMediaUrl = signal<string>('');
  readonly zoomedMediaTitle = signal<string>('');
  readonly zoomedMediaType = signal<'image' | 'video'>('image');
  readonly zoomedMediaProduct = signal<ProductData | null>(null);
  readonly zoomedMediaIndex = signal<number>(0);

  // ===== COMPUTADAS PARA FILTRADO =====
  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const products = this.productsData();

    if (category === 'Todos') {
      return products;
    }

    return products.filter(
      (product) => this.getCategoryTitle(product.category) === category,
    );
  });

  // ===== SEÑALES DE TESTIMONIOS =====
  readonly testimonialRating = signal<number>(0);
  readonly hoverTestimonialRating = signal<number | null>(null);
  readonly isTestimonialSubmitting = signal(false);
  readonly testimonialImageFile = signal<File | null>(null);
  readonly testimonialImagePreview = signal<string | null>(null);

  // ===== TIMERS =====
  private noDataTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private carouselInterval: ReturnType<typeof setInterval> | null = null;
  private reviewsInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CAROUSEL_INTERVAL_TIME = 7000; // 7 segundos
  private readonly REVIEWS_INTERVAL_TIME = 5000; // 5 segundos

  // ===== CONSTRUCTOR =====
  constructor() {
    // Cargar datos del home y productos
    this.homeState.loadCarouselOnly();

    // Cargar reseñas
    this.loadReviews();

    // Usar afterNextRender para operaciones DOM
    if (this.isBrowser) {
      afterNextRender(() => {
        effect(
          () => {
            if (this.allDataReady()) {
              this.scheduleAnimation(500, () => {
                this.checkScrollability();
              });
            }
          },
          { injector: this.injector },
        );
      });
    }

    // Inicializar Embla para carrusel de productos en cards
    if (this.isBrowser) {
      afterNextRender(() => {
        effect(
          () => {
            const viewport = this.emblaViewport();
            const products = this.filteredProducts();

            if (viewport) {
              this.destroyEmbla();
              if (products.length > 0) {
                setTimeout(() => this.initEmblaCarousel(), 0);
              }
            }
          },
          { injector: this.injector },
        );
      });
    }

    // Efecto para cargar datos iniciales de productos
    effect(
      () => {
        if (this.isBrowser) {
          this.homeState
            .loadIfNeeded()
            .then(() => {
              if (this.allDataReady()) {
                this.startAnimationSequence();
              }
            })
            .catch((error) => {
              console.error('[HomeComponent] Error cargando productos:', error);
            });
        }
      },
      { injector: this.injector },
    );

    // Efecto para manejar estado de "no datos" de productos
    effect(
      () => {
        const loading = this.isLoading();
        const filtered = this.filteredProducts();
        const category = this.selectedCategory();

        if (loading) {
          this.cancelNoDataTimeout();
          this.showNoDataMessage.set(false);
          this.resetNoDataAnimations();
          return;
        }

        if (filtered.length === 0 && category !== 'Todos') {
          this.startNoDataTimeout();
        } else {
          this.cancelNoDataTimeout();
          this.showNoDataMessage.set(false);
          this.resetNoDataAnimations();
        }
      },
      { injector: this.injector },
    );

    // Efecto para manejar resize
    if (this.isBrowser) {
      afterNextRender(() => {
        effect(
          () => {
            const handleResize = () => {
              this.checkScrollability();
              this.checkVariantScrollability();
            };

            window.addEventListener('resize', handleResize);

            this.resizeObserver = new ResizeObserver(() => {
              setTimeout(() => {
                this.checkScrollability();
                this.checkVariantScrollability();
              }, 100);
            });

            this.resizeObserver.observe(document.body);

            this.destroyRef.onDestroy(() => {
              window.removeEventListener('resize', handleResize);
              this.resizeObserver?.disconnect();
            });
          },
          { injector: this.injector },
        );
      });
    }

    // Setup para cerrar modales con Escape
    this.setupModalEscapeEffect();

    // Efecto para ocultar skeleton del carrusel cuando los datos estén listos
    effect(() => {
      const carousel = this.carouselData();
      if (carousel.length > 0) {
        setTimeout(() => {
          this.showCarouselSkeleton.set(false);
          // Iniciar el carrusel automático después de ocultar el skeleton
          this.startCarouselAutoplay();
        }, 300);
      }
    });

    // Efecto para ocultar skeleton de reseñas cuando los datos estén listos
    effect(() => {
      const reviews = this.reviewsData();
      if (reviews.length > 0) {
        setTimeout(() => {
          this.showReviewsSkeleton.set(false);
          // Iniciar el carrusel de reseñas automático después de ocultar el skeleton
          this.startReviewsAutoplay();
        }, 300);
      }
    });

    // Efecto para estados de noticias
    // Limpieza al destruir
    this.destroyRef.onDestroy(() => {
      this.cancelNoDataTimeout();
      this.stopCarouselAutoplay();
      this.stopReviewsAutoplay();
      this.destroyEmbla();
      // Limpiar todos los timeouts de scroll
      this.scrollTimeouts.forEach((timeout) => clearTimeout(timeout));
      this.scrollTimeouts.clear();
      if (this.isBrowser) {
        document.body.style.overflow = 'auto';
      }
    });
  }

  // ===== MÃ‰TODOS DE ANIMACIÃ“N (PRODUCTOS) =====
  private startAnimationSequence(): void {
    if (!this.isBrowser) return;

    this.scheduleAnimation(100, () => {
      this.isHeaderLoaded.set(true);
    });

    this.scheduleAnimation(300, () => {
      if (this.hasCategories()) {
        this.isFiltersLoaded.set(true);
      }
    });

    this.scheduleAnimation(500, () => {
      if (this.filteredProducts().length > 0) {
        this.isProductsGridLoaded.set(true);
      } else if (this.allDataReady() && !this.isLoading()) {
        this.startNoDataAnimationSequence();
      }
    });
  }

  private scheduleAnimation(delay: number, callback: () => void): void {
    if (!this.isBrowser) return;
    setTimeout(callback, delay);
  }

  private startNoDataAnimationSequence(): void {
    this.showNoDataMessage.set(true);

    this.scheduleAnimation(50, () => {
      this.isNoDataLoaded.set(true);
    });

    this.scheduleAnimation(200, () => {
      this.isNoDataIconLoaded.set(true);
    });

    this.scheduleAnimation(400, () => {
      this.isNoDataTextLoaded.set(true);
    });
  }

  private resetNoDataAnimations(): void {
    this.isNoDataLoaded.set(false);
    this.isNoDataIconLoaded.set(false);
    this.isNoDataTextLoaded.set(false);
  }

  private startNoDataTimeout(): void {
    this.cancelNoDataTimeout();
    this.resetNoDataAnimations();
    this.showNoDataMessage.set(true);
    this.startNoDataAnimationSequence();
  }

  private cancelNoDataTimeout(): void {
    if (this.noDataTimeoutId) {
      clearTimeout(this.noDataTimeoutId);
      this.noDataTimeoutId = null;
    }
  }

  // ===== MÉTODOS PÚBLICOS DE PRODUCTOS =====
  getCategoryTitle(category: any): string {
    return typeof category === 'string' ? category : category?.title || '';
  }

  // ===== SCROLL DE CATEGORÃAS =====
  private checkScrollability(): void {
    if (!this.isBrowser) return;

    const scroller = this.categoryScroller();
    if (!scroller) return;

    const element = scroller.nativeElement;
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;

    this.canScrollLeft.set(scrollLeft > 5);
    this.canScrollRight.set(scrollLeft < scrollWidth - clientWidth - 5);
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLDivElement;
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;
    this.canScrollLeft.set(scrollLeft > 5);
    this.canScrollRight.set(scrollLeft < scrollWidth - clientWidth - 5);
  }

  scrollCategoriesLeft(): void {
    if (!this.isBrowser) return;

    const scroller = this.categoryScroller();
    if (scroller) {
      scroller.nativeElement.scrollBy({
        left: -this.SCROLL_AMOUNT,
        behavior: 'smooth',
      });
    }
  }

  scrollCategoriesRight(): void {
    if (!this.isBrowser) return;

    const scroller = this.categoryScroller();
    if (scroller) {
      scroller.nativeElement.scrollBy({
        left: this.SCROLL_AMOUNT,
        behavior: 'smooth',
      });
    }
  }

  // ===== FILTRADO =====
  filterByCategory(category: string): void {
    if (this.selectedCategory() === category) return;

    const categories = this.categoriesData();
    const categoryIndex = categories.findIndex(
      (cat) => this.getCategoryTitle(cat) === category,
    );

    this.cancelNoDataTimeout();
    this.showNoDataMessage.set(false);
    this.resetNoDataAnimations();

    this.selectedCategory.set(category);

    if (this.isBrowser && categoryIndex >= 0) {
      setTimeout(() => {
        this.scrollToSelectedCategory(categoryIndex + 1);
      }, 150);
    } else if (category === 'Todos') {
      setTimeout(() => {
        this.scrollToSelectedCategory(0);
      }, 150);
    }

    if (this.filteredProducts().length === 0 && category !== 'Todos') {
      this.startNoDataTimeout();
    }
  }

  private scrollToSelectedCategory(index: number): void {
    const scroller = this.categoryScroller();
    if (!scroller) {
      return;
    }

    const container = scroller.nativeElement;
    const buttons = container.querySelectorAll('button');
    const selectedButton = buttons[index] as HTMLElement;

    if (selectedButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = selectedButton.getBoundingClientRect();

      const isFullyVisible =
        buttonRect.left >= containerRect.left &&
        buttonRect.right <= containerRect.right;

      if (!isFullyVisible) {
        const scrollLeft =
          selectedButton.offsetLeft -
          container.clientWidth / 2 +
          selectedButton.clientWidth / 2;

        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth',
        });
      }

      setTimeout(() => {
        this.checkScrollability();
      }, 300);
    }
  }

  // ===== SCROLL DE VARIANTES =====
  private checkVariantScrollability(): void {
    if (!this.isBrowser) return;

    const scroller = this.variantScroller();
    if (!scroller) return;

    const element = scroller.nativeElement;
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;

    this.canScrollVariantsLeft.set(scrollLeft > 5);
    this.canScrollVariantsRight.set(scrollLeft < scrollWidth - clientWidth - 5);
  }

  onVariantScroll(event: Event): void {
    const element = event.target as HTMLDivElement;
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;
    this.canScrollVariantsLeft.set(scrollLeft > 5);
    this.canScrollVariantsRight.set(scrollLeft < scrollWidth - clientWidth - 5);
  }

  scrollVariantsLeft(): void {
    if (!this.isBrowser) return;

    const scroller = this.variantScroller();
    if (scroller) {
      scroller.nativeElement.scrollBy({
        left: -200,
        behavior: 'smooth',
      });
    }
  }

  scrollVariantsRight(): void {
    if (!this.isBrowser) return;

    const scroller = this.variantScroller();
    if (scroller) {
      scroller.nativeElement.scrollBy({
        left: 200,
        behavior: 'smooth',
      });
    }
  }

  // ===== MODAL DE PRODUCTO =====
  showProductDetails(product: ProductData): void {
    this.selectedProduct.set(product);
    this.isProductTitleExpanded.set(false);

    if (product.variants.length > 0) {
      this.selectedVariant.set(product.variants[0]);
      this.selectedVariantIndex.set(0);
    }

    if (product.files && product.files.length > 0) {
      this.productImages.set(product.files);
      this.currentImageIndex.set(0);
      this.loadCurrentImageUrl();
    } else {
      this.productImages.set([]);
      this.currentImageIndex.set(0);
      this.currentImageUrl.set(product.imageUrl);
    }

    this.canScrollVariantsLeft.set(false);
    this.canScrollVariantsRight.set(false);

    if (this.isBrowser) {
      setTimeout(() => {
        this.checkVariantScrollability();
      }, 200);
    }
  }

  selectVariant(variant: ProductVariant, index: number): void {
    this.selectedVariant.set(variant);
    this.selectedVariantIndex.set(index);

    if (this.isBrowser) {
      setTimeout(() => {
        this.scrollToSelectedVariant(index);
      }, 150);
    }
  }

  private scrollToSelectedVariant(index: number): void {
    const scroller = this.variantScroller();
    if (!scroller) {
      return;
    }

    const container = scroller.nativeElement;
    const buttons = container.querySelectorAll('button');
    const selectedButton = buttons[index] as HTMLElement;

    if (selectedButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = selectedButton.getBoundingClientRect();

      const isFullyVisible =
        buttonRect.left >= containerRect.left &&
        buttonRect.right <= containerRect.right;

      if (!isFullyVisible) {
        const scrollLeft =
          selectedButton.offsetLeft -
          container.clientWidth / 2 +
          selectedButton.clientWidth / 2;

        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth',
        });
      }

      setTimeout(() => {
        this.checkVariantScrollability();
      }, 300);
    }
  }

  closeProductDetails(): void {
    this.selectedProduct.set(null);
    this.selectedVariant.set(null);
    this.selectedVariantIndex.set(0);
    this.canScrollVariantsLeft.set(false);
    this.canScrollVariantsRight.set(false);
    this.currentImageIndex.set(0);
    this.productImages.set([]);
    this.currentImageUrl.set('');
    this.isProductTitleExpanded.set(false);
  }

  // ===== IMÃGENES =====
  getCardImageUrl(product: ProductData): string {
    return product.imageUrl || this.DEFAULT_IMAGE;
  }

  hasImageToShow(product: ProductData): boolean {
    return !!product.imageUrl && !this.isUsingDefault(product.imageUrl);
  }

  getFirstImageTitle(product: ProductData): string {
    if (product.files && product.files.length > 0) {
      return product.files[0].title;
    }
    return product.title;
  }

  getCurrentImageTitle(): string {
    const selectedProduct = this.selectedProduct();
    if (!selectedProduct) return '';

    const images = this.productImages();
    const currentIndex = this.currentImageIndex();

    if (images.length > 0 && currentIndex < images.length) {
      return images[currentIndex].title;
    }

    return selectedProduct.title;
  }

  getCurrentMediaType(): 'image' | 'video' {
    const selectedProduct = this.selectedProduct();
    if (!selectedProduct) return 'image';

    const images = this.productImages();
    const currentIndex = this.currentImageIndex();

    if (images.length > 0 && currentIndex < images.length) {
      const currentFile = images[currentIndex];
      const fileName = currentFile.media;

      if (this.isVideoFile(fileName)) {
        return 'video';
      }
      if (this.isImageFile(fileName)) {
        return 'image';
      }
    }

    // Verificar el mediaType del producto y la URL
    if (
      selectedProduct.mediaType === 'video' &&
      this.isVideoFile(selectedProduct.imageUrl)
    ) {
      return 'video';
    }

    // Por defecto, tratar como imagen
    return 'image';
  }

  nextImage(): void {
    const images = this.productImages();
    if (images.length > 0) {
      const currentIndex = this.currentImageIndex();
      const nextIndex = (currentIndex + 1) % images.length;
      this.currentImageIndex.set(nextIndex);
      this.loadCurrentImageUrl();
    }
  }

  previousImage(): void {
    const images = this.productImages();
    if (images.length > 0) {
      const currentIndex = this.currentImageIndex();
      const prevIndex =
        currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      this.currentImageIndex.set(prevIndex);
      this.loadCurrentImageUrl();
    }
  }

  private loadCurrentImageUrl(): void {
    const images = this.productImages();
    const currentIndex = this.currentImageIndex();

    if (images.length > 0 && currentIndex < images.length) {
      const currentImage = images[currentIndex];
      const imageUrl = this.homeState.getImageUrl(currentImage.media);
      this.currentImageUrl.set(imageUrl);
    }
  }

  private isVideoFile(fileName: string | null | undefined): boolean {
    if (!fileName) return false;
    const lowerFileName = fileName.toLowerCase();
    const videoExtensions = [
      '.mp4',
      '.mov',
      '.webm',
      '.avi',
      '.mkv',
      '.flv',
      '.wmv',
      '.m4v',
    ];
    return videoExtensions.some((ext) => lowerFileName.endsWith(ext));
  }

  private isImageFile(fileName: string | null | undefined): boolean {
    if (!fileName) return false;
    const lowerFileName = fileName.toLowerCase();
    const imageExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.bmp',
      '.ico',
    ];
    return imageExtensions.some((ext) => lowerFileName.endsWith(ext));
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Prevenir loop infinito: solo intentar cargar la imagen por defecto una vez
    if (!img.src.includes('img_default.webp')) {
      img.src = this.DEFAULT_IMAGE;
    }
  }

  onModalImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Prevenir loop infinito: solo intentar cargar la imagen por defecto una vez
    if (!img.src.includes('img_default.webp')) {
      img.src = this.DEFAULT_IMAGE;
    }
  }

  isUsingDefault(url: string | null | undefined): boolean {
    return this.homeState.isDefaultImage(url);
  }

  // ===== MÃ‰TODOS DE ARCHIVOS =====
  downloadFile(fileUrl: string, title: string): void {
    if (this.isBrowser && fileUrl && fileUrl.trim() !== '') {
      const fileFullUrl = this.homeState.getFileUrl(fileUrl);

      if (!fileFullUrl) {
        console.error('No se pudo obtener la URL del archivo');
        return;
      }

      const link = document.createElement('a');
      link.href = fileFullUrl;
      link.download = title || 'product_file';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  getCardMediaType(product: ProductData): 'image' | 'video' {
    if (product.files && product.files.length > 0) {
      const firstFile = product.files[0];
      if (this.isVideoFile(firstFile.media)) {
        return 'video';
      }
      if (this.isImageFile(firstFile.media)) {
        return 'image';
      }
    }

    // Verificar el mediaType del producto
    if (product.mediaType === 'video' && this.isVideoFile(product.imageUrl)) {
      return 'video';
    }

    // Por defecto, tratar como imagen
    return 'image';
  }
  getCarouselMediaType(item: HomeData): 'image' | 'video' {
    // Verificar si la URL del item es un video
    if (this.isVideoFile(item.imageUrl)) {
      return 'video';
    }

    // Si tiene mediaType definido como video, verificar que realmente sea un video
    if (item.mediaType === 'video' && this.isVideoFile(item.imageUrl)) {
      return 'video';
    }

    // Por defecto, tratar como imagen
    return 'image';
  }

  // ===== ZOOM DE MEDIA =====
  openMediaZoom(
    mediaUrl: string,
    title: string,
    mediaType: 'image' | 'video',
    product?: ProductData,
  ): void {
    this.zoomedMediaUrl.set(mediaUrl);
    this.zoomedMediaTitle.set(title);
    this.zoomedMediaType.set(mediaType);
    this.zoomedMediaProduct.set(product || null);
    this.zoomedMediaIndex.set(0);
    this.showMediaZoom.set(true);

    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeMediaZoom(): void {
    this.showMediaZoom.set(false);
    this.zoomedMediaUrl.set('');
    this.zoomedMediaTitle.set('');
    this.zoomedMediaType.set('image');
    this.zoomedMediaProduct.set(null);
    this.zoomedMediaIndex.set(0);

    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
  }

  nextZoomedMedia(): void {
    const product = this.zoomedMediaProduct();
    if (!product || !product.files || product.files.length === 0) return;

    const currentIndex = this.zoomedMediaIndex();
    const nextIndex = (currentIndex + 1) % product.files.length;
    this.zoomedMediaIndex.set(nextIndex);

    const nextFile = product.files[nextIndex];
    const mediaUrl = this.homeState.getImageUrl(nextFile.media);
    const mediaType = this.isVideoFile(nextFile.media) ? 'video' : 'image';

    this.zoomedMediaUrl.set(mediaUrl);
    this.zoomedMediaTitle.set(nextFile.title);
    this.zoomedMediaType.set(mediaType);
  }

  previousZoomedMedia(): void {
    const product = this.zoomedMediaProduct();
    if (!product || !product.files || product.files.length === 0) return;

    const currentIndex = this.zoomedMediaIndex();
    const prevIndex =
      currentIndex === 0 ? product.files.length - 1 : currentIndex - 1;
    this.zoomedMediaIndex.set(prevIndex);

    const prevFile = product.files[prevIndex];
    const mediaUrl = this.homeState.getImageUrl(prevFile.media);
    const mediaType = this.isVideoFile(prevFile.media) ? 'video' : 'image';

    this.zoomedMediaUrl.set(mediaUrl);
    this.zoomedMediaTitle.set(prevFile.title);
    this.zoomedMediaType.set(mediaType);
  }

  hasMultipleMediaFiles(): boolean {
    const product = this.zoomedMediaProduct();
    return !!(product && product.files && product.files.length > 1);
  }

  // ===== TRACKING =====
  trackByCategory(index: number, category: any): string | number {
    return category?.id || category?.title || index;
  }

  trackByProduct(index: number, product: ProductData): string | number {
    return product.id || index;
  }

  trackByVariant(index: number, variant: ProductVariant): string | number {
    return index;
  }

  trackByFn(index: number, item: HomeData): number {
    return item?.id || index;
  }

  toggleProductTitleExpansion(): void {
    this.isProductTitleExpanded.update((expanded) => !expanded);
  }

  // ===== SETUP PARA ESCAPE =====
  private setupModalEscapeEffect(): void {
    effect(() => {
      if (this.isBrowser) {
        const handleEscape = (event: KeyboardEvent) => {
          if (event.key === 'Escape' || event.key === 'Esc') {
            if (this.showMediaZoom()) {
              this.closeMediaZoom();
            }
            if (this.selectedProduct()) {
              this.closeProductDetails();
            }
          }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
          window.removeEventListener('keydown', handleEscape);
        };
      }

      return () => {};
    });
  }

  // ===== MÉTODOS PÚBLICOS DEL HOME =====

  getImageUrl(path: string | null | undefined): string {
    return this.homeState.getImageUrl(path);
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Prevenir loop infinito: solo intentar cargar la imagen por defecto una vez
    if (!img.src.includes('img_default.webp')) {
      img.src = this.homeState.getDefaultImageUrl();
    }
  }

  handleVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.style.display = 'none';
  }

  forceVideoMute(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video) {
      video.muted = true;
      video.volume = 0;
      // Forzar el silencio incluso si el navegador intenta reproducir con audio
      video.setAttribute('muted', 'true');
    }
  }

  // ===== CARRUSEL (MÉTODOS EXISTENTES) =====

  private startCarouselAutoplay(): void {
    if (!this.isBrowser) return;

    // Limpiar cualquier intervalo existente
    this.stopCarouselAutoplay();

    // Solo iniciar si hay más de una diapositiva
    const data = this.carouselData();
    if (data.length <= 1) return;

    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, this.CAROUSEL_INTERVAL_TIME);
  }

  private stopCarouselAutoplay(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  private resetCarouselAutoplay(): void {
    this.stopCarouselAutoplay();
    this.startCarouselAutoplay();
  }

  prevSlide(): void {
    const data = this.carouselData();
    if (data.length === 0) return;
    this.currentSlide.update((i) => (i === 0 ? data.length - 1 : i - 1));
    // Reiniciar el temporizador cuando el usuario interactúa
    this.resetCarouselAutoplay();
  }

  nextSlide(): void {
    const data = this.carouselData();
    if (data.length === 0) return;
    this.currentSlide.update((i) => (i === data.length - 1 ? 0 : i + 1));
    // Reiniciar el temporizador cuando el usuario interactúa
    this.resetCarouselAutoplay();
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    // Reiniciar el temporizador cuando el usuario interactúa
    this.resetCarouselAutoplay();
  }

  scrollToProduct(index: number): void {
    const element = document.getElementById(`product-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToFirstProduct(): void {
    this.scrollToProduct(0);
  }

  // ===== MÉTODOS PARA VARIANTES EN CARDS =====
  getCardSelectedVariantIndex(productId: string | number): number {
    return this.cardSelectedVariants().get(productId) ?? 0;
  }

  getCardSelectedVariant(product: ProductData): ProductVariant | null {
    if (!product.variants || product.variants.length === 0) return null;
    const index = this.getCardSelectedVariantIndex(product.id);
    return product.variants[index] || product.variants[0];
  }

  selectCardVariant(
    product: ProductData,
    variantIndex: number,
    event?: Event,
  ): void {
    if (event) {
      event.stopPropagation();
    }

    const newMap = new Map(this.cardSelectedVariants());
    newMap.set(product.id, variantIndex);
    this.cardSelectedVariants.set(newMap);
  }

  scrollCardVariantsLeft(
    productId: string | number,
    scrollerElement: HTMLDivElement,
    event?: Event,
  ): void {
    if (event) {
      event.stopPropagation();
    }

    if (!this.isBrowser) return;

    if (scrollerElement) {
      scrollerElement.scrollBy({
        left: -200,
        behavior: 'smooth',
      });
    }
  }

  scrollCardVariantsRight(
    productId: string | number,
    scrollerElement: HTMLDivElement,
    event?: Event,
  ): void {
    if (event) {
      event.stopPropagation();
    }

    if (!this.isBrowser) return;

    if (scrollerElement) {
      scrollerElement.scrollBy({
        left: 200,
        behavior: 'smooth',
      });
    }
  }

  // Estado de scroll para cada producto
  private cardVariantScrollStates = signal<
    Map<string | number, { canScrollLeft: boolean; canScrollRight: boolean }>
  >(new Map());

  private scrollTimeouts = new Map<
    string | number,
    ReturnType<typeof setTimeout>
  >();

  onCardVariantScroll(event: Event, productId: string | number): void {
    // Limpiar timeout anterior si existe
    const existingTimeout = this.scrollTimeouts.get(productId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Debounce: esperar 100ms antes de actualizar el estado
    const timeout = setTimeout(() => {
      const element = event.target as HTMLDivElement;
      if (!element) return;

      const canLeft = element.scrollLeft > 0;
      const canRight =
        element.scrollLeft < element.scrollWidth - element.clientWidth;

      const newMap = new Map(this.cardVariantScrollStates());
      newMap.set(productId, {
        canScrollLeft: canLeft,
        canScrollRight: canRight,
      });
      this.cardVariantScrollStates.set(newMap);

      this.scrollTimeouts.delete(productId);
    }, 100);

    this.scrollTimeouts.set(productId, timeout);
  }

  canScrollCardVariantsLeft(productId: string | number): boolean {
    const product = this.productsData().find((p) => p.id === productId);
    if (product && product.variants && product.variants.length <= 1) {
      return false;
    }
    return this.cardVariantScrollStates().get(productId)?.canScrollLeft ?? true;
  }

  canScrollCardVariantsRight(productId: string | number): boolean {
    const product = this.productsData().find((p) => p.id === productId);
    if (product && product.variants && product.variants.length <= 1) {
      return false;
    }
    return (
      this.cardVariantScrollStates().get(productId)?.canScrollRight ?? true
    );
  }

  // ===== MÉTODOS DE RESEÑAS =====
  private loadReviews(): void {
    if (!this.isBrowser) return;

    this.isReviewsLoading.set(true);
    this.reviewService.get(true).subscribe({
      next: (reviews) => {
        this.reviewsData.set(reviews);
        this.isReviewsLoading.set(false);
      },
      error: (error) => {
        console.error('[HomeComponent] Error cargando reseñas:', error);
        this.isReviewsLoading.set(false);
      },
    });
  }

  getStarsArray(rating: number | undefined): number[] {
    if (!rating) return [];
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    return [
      ...Array(full).fill(1),
      ...(hasHalf ? [0.5] : []),
      ...Array(empty).fill(0),
    ];
  }

  private startReviewsAutoplay(): void {
    if (!this.isBrowser) return;

    // Limpiar cualquier intervalo existente
    this.stopReviewsAutoplay();

    // Solo iniciar si hay más de una reseña
    const reviews = this.reviewsData();
    if (reviews.length <= 1) return;

    this.reviewsInterval = setInterval(() => {
      this.nextReviewSlide();
    }, this.REVIEWS_INTERVAL_TIME);
  }

  private stopReviewsAutoplay(): void {
    if (this.reviewsInterval) {
      clearInterval(this.reviewsInterval);
      this.reviewsInterval = null;
    }
  }

  private resetReviewsAutoplay(): void {
    this.stopReviewsAutoplay();
    this.startReviewsAutoplay();
  }

  prevReviewSlide(): void {
    const reviews = this.reviewsData();
    if (reviews.length === 0) return;
    this.currentReviewSlide.update((i) =>
      i === 0 ? reviews.length - 1 : i - 1,
    );
    // Reiniciar el temporizador cuando el usuario interactúa
    this.resetReviewsAutoplay();
  }

  nextReviewSlide(): void {
    const reviews = this.reviewsData();
    if (reviews.length === 0) return;
    this.currentReviewSlide.update((i) =>
      i === reviews.length - 1 ? 0 : i + 1,
    );
    // Reiniciar el temporizador cuando el usuario interactúa
    this.resetReviewsAutoplay();
  }

  goToReviewSlide(index: number): void {
    this.currentReviewSlide.set(index);
    // Reiniciar el temporizador cuando el usuario interactúa
    this.resetReviewsAutoplay();
  }

  getReviewImageUrl(path: string | null | undefined): string {
    return this.reviewService.getImageUrl(path || '');
  }

  trackByReview(index: number, review: HomeData): number {
    return review?.id || index;
  }

  getReviewStarWidth(starIndex: number, rating: number | undefined): number {
    if (!rating) return 0;
    if (rating >= starIndex) {
      return 20;
    }
    if (rating <= starIndex - 1) {
      return 0;
    }
    const fraction = rating - (starIndex - 1);
    return fraction * 20;
  }

  // ===== MÉTODOS DE TESTIMONIOS =====
  onStarMouseMove(event: MouseEvent, starIndex: number): void {
    const value = this.calculateTestimonialRatingFromEvent(event, starIndex);
    this.hoverTestimonialRating.set(value);
  }

  onStarMouseLeave(): void {
    this.hoverTestimonialRating.set(null);
  }

  onStarClick(event: MouseEvent, starIndex: number): void {
    const value = this.calculateTestimonialRatingFromEvent(event, starIndex);
    this.setTestimonialRating(value);
  }

  private calculateTestimonialRatingFromEvent(
    event: MouseEvent,
    starIndex: number,
  ): number {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const rawVal = starIndex - 1 + ratio;
    return Math.max(0.1, Math.min(5.0, Math.round(rawVal * 10) / 10));
  }

  getTestimonialStarWidth(starIndex: number): number {
    const rating =
      this.hoverTestimonialRating() ?? this.testimonialRating() ?? 0;
    if (rating >= starIndex) {
      return 20;
    }
    if (rating <= starIndex - 1) {
      return 0;
    }
    const fraction = rating - (starIndex - 1);
    return fraction * 20;
  }

  setTestimonialRating(rating: number): void {
    if (this.testimonialRating() === rating) {
      this.testimonialRating.set(0);
    } else {
      this.testimonialRating.set(rating);
    }
  }

  onTestimonialImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      this.notificationService.addNotification(
        'Por favor selecciona un archivo de imagen válido',
        'error',
      );
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.notificationService.addNotification(
        'La imagen debe ser menor a 5MB',
        'error',
      );
      return;
    }

    this.testimonialImageFile.set(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = () => {
      this.testimonialImagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeTestimonialImage(): void {
    this.testimonialImageFile.set(null);
    this.testimonialImagePreview.set(null);
    const input = document.getElementById(
      'testimonialImageInput',
    ) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  submitTestimonial(name: string, message: string): void {
    // Validar campos
    if (!name || !name.trim()) {
      this.notificationService.addNotification(
        this.translocoService.translate('notifications.error.name_required'),
        'error',
      );
      return;
    }

    if (!message || !message.trim()) {
      this.notificationService.addNotification(
        this.translocoService.translate('notifications.error.message_required'),
        'error',
      );
      return;
    }

    if (this.testimonialRating() === 0) {
      this.notificationService.addNotification(
        this.translocoService.translate('notifications.error.rating_required'),
        'error',
      );
      return;
    }

    this.isTestimonialSubmitting.set(true);

    // Siempre enviar como FormData (como en el dashboard)
    const formData = new FormData();
    formData.append('title', name.trim());
    formData.append('description', message.trim());
    formData.append('star_rating', this.testimonialRating().toString());
    formData.append('active', 'false');

    const image = this.testimonialImageFile();
    if (image) {
      formData.append('photo', image);
    }

    this.reviewService.post(formData).subscribe({
      next: () => this.handleTestimonialSuccess(),
      error: (error) => this.handleTestimonialError(error),
    });
  }

  private handleTestimonialSuccess(): void {
    this.notificationService.addNotification(
      this.translocoService.translate('notifications.success.testimonial_sent'),
      'success',
    );

    // Limpiar formulario
    this.testimonialRating.set(0);
    this.testimonialImageFile.set(null);
    this.testimonialImagePreview.set(null);

    const form = document.querySelector('#testimonialForm') as HTMLFormElement;
    if (form) {
      form.reset();
    }
    const input = document.getElementById(
      'testimonialImageInput',
    ) as HTMLInputElement;
    if (input) {
      input.value = '';
    }

    this.isTestimonialSubmitting.set(false);

    // Recargar reseñas
    this.loadReviews();
  }

  private handleTestimonialError(error: any): void {
    console.error('[HomeComponent] Error enviando testimonio:', error);
    this.notificationService.addNotification(
      this.translocoService.translate('notifications.error.testimonial_failed'),
      'error',
    );
    this.isTestimonialSubmitting.set(false);
  }

  // ===== EMBLA CARRUSEL (PRODUCTOS EN CARDS) =====
  private destroyEmbla(): void {
    if (this.emblaApi) {
      this.emblaApi.destroy();
      this.emblaApi = null;
    }
  }

  private initEmblaCarousel(): void {
    const viewportEl = this.emblaViewport()?.nativeElement;
    if (!viewportEl || this.emblaApi) return;

    this.emblaApi = EmblaCarousel(viewportEl, {
      align: 'start',
      slidesToScroll: 3,
      containScroll: 'trimSnaps',
      breakpoints: {
        '(max-width: 767px)': {
          slidesToScroll: 1,
        },
      },
    });

    const onSelect = () => {
      if (!this.emblaApi) return;
      this.emblaSelectedSnap.set(this.emblaApi.selectedScrollSnap());
      this.emblaSnapCount.set(this.emblaApi.scrollSnapList().length);
      this.emblaCanScrollPrev.set(this.emblaApi.canScrollPrev());
      this.emblaCanScrollNext.set(this.emblaApi.canScrollNext());
    };

    this.emblaApi.on('init', onSelect);
    this.emblaApi.on('select', onSelect);
    this.emblaApi.on('reInit', onSelect);
    onSelect();
  }

  onEmblaPrevClick(): void {
    this.emblaApi?.scrollPrev();
  }

  onEmblaNextClick(): void {
    this.emblaApi?.scrollNext();
  }

  onEmblaDotClick(index: number): void {
    this.emblaApi?.scrollTo(index);
  }

  scrollToServices(): void {
    if (!this.isBrowser) return;
    const el = document.getElementById('services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  range(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }
}
