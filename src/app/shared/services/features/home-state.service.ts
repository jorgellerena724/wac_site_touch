import {
  Injectable,
  signal,
  computed,
  Inject,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CarrouselService } from './carrousel.service';
import { CategoryService } from './category.service';
import { HomeData } from '../../interfaces/homeData.interface';
import {
  CategoryData,
  ProductData,
} from '../../interfaces/productData.interface';
import { take, takeUntil, firstValueFrom, catchError, timeout } from 'rxjs';
import { of, Subject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LibreTranslateService } from '../system/libre-translate.service';
import { TranslocoService } from '@jsverse/transloco';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HomeStateService implements OnDestroy {
  private readonly defaultLanguage = environment.defaultLanguage;
  private isBrowser: boolean = false;
  private apiUrl = environment.api;
  private localImgPath = environment.imgPath;

  // ===== CAROUSEL & NEWS =====
  isCarouselLoaded = signal(false);
  isNewsLoaded = signal(false);

  // Señales para datos traducidos
  private carouselTranslatedSignal = signal<HomeData[]>([]);
  private newsTranslatedSignal = signal<HomeData[]>([]);

  // Señales internas para datos originales
  private carouselSignal = signal<HomeData[]>([]);
  private newsSignal = signal<HomeData[]>([]);

  // Datos originales en español
  private carouselOriginalData: HomeData[] = [];
  private newsOriginalData: HomeData[] = [];

  // Señales de estado de carga
  private carouselLoadingSignal = signal<boolean>(true);
  private newsLoadingSignal = signal<boolean>(true);

  // ===== PRODUCTS & CATEGORIES =====
  // Almacenar datos originales
  private productsOriginal: ProductData[] = [];
  private categoriesOriginal: CategoryData[] = [];

  // Señales internas
  private productsSignal = signal<ProductData[]>([]);
  private categoriesSignal = signal<CategoryData[]>([]);

  // Señales de estado de carga SEPARADAS
  private productsLoadingSignal = signal<boolean>(true);
  private categoriesLoadingSignal = signal<boolean>(true);
  private productsDataLoadedSignal = signal<boolean>(false);
  private categoriesDataLoadedSignal = signal<boolean>(false);

  // Señales públicas computadas para productos
  readonly products$ = computed(() => this.productsSignal());
  readonly categories$ = computed(() => this.categoriesSignal());
  readonly isProductsLoading$ = computed(() => this.productsLoadingSignal());
  readonly isCategoriesLoading$ = computed(() =>
    this.categoriesLoadingSignal(),
  );

  // Señales para saber si los DATOS están listos (sin esperar imágenes)
  readonly isProductsDataReady$ = computed(() =>
    this.productsDataLoadedSignal(),
  );
  readonly isCategoriesDataReady$ = computed(() =>
    this.categoriesDataLoadedSignal(),
  );

  // ===== SHARED =====
  // Señal para estado de traducción
  isTranslating = signal(false);
  private translateDebounce: any;

  // Señales públicas computadas
  readonly carouselWithImages$ = computed(() =>
    this.carouselTranslatedSignal(),
  );
  readonly newsWithImages$ = computed(() => this.newsTranslatedSignal());
  readonly isCarouselLoading$ = computed(() => this.carouselLoadingSignal());
  readonly isNewsLoading$ = computed(() => this.newsLoadingSignal());

  private destroy$ = new Subject<void>();

  // Cache de estado de carga
  private hasLoadedOnce = false;

  constructor(
    private carrouselSrv: CarrouselService,
    private categorySrv: CategoryService,
    private translateService: LibreTranslateService,
    private translocoService: TranslocoService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.translocoService.langChanges$
        .pipe(takeUntil(this.destroy$))
        .subscribe((lang) => {
          this.handleLanguageChange(lang);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.translateDebounce) {
      clearTimeout(this.translateDebounce);
    }
  }

  private handleLanguageChange(lang: string): void {
    if (this.translateDebounce) {
      clearTimeout(this.translateDebounce);
    }

    this.translateDebounce = setTimeout(() => {
      if (lang === this.defaultLanguage) {
        this.carouselTranslatedSignal.set([...this.carouselOriginalData]);
        this.newsTranslatedSignal.set([...this.newsOriginalData]);
        this.productsSignal.set([...this.productsOriginal]);
        this.categoriesSignal.set([...this.categoriesOriginal]);
      } else {
        this.translateAllDynamicTexts();
      }
    }, 300);
  }

  private isVideoFile(fileName: string | null | undefined): boolean {
    if (!fileName) return false;
    const lowerFileName = fileName.toLowerCase();
    return lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.mov');
  }

  async translateAllDynamicTexts(): Promise<void> {
    this.isTranslating.set(true);

    try {
      if (this.carouselOriginalData.length > 0) {
        await this.translateCarouselTexts();
      }

      if (this.newsOriginalData.length > 0) {
        await this.translateNewsTexts();
      }

      if (this.categoriesOriginal.length > 0) {
        await this.translateCategoriesInternal();
      }

      if (this.productsOriginal.length > 0) {
        await this.translateProductsInternal();
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      this.isTranslating.set(false);
    }
  }

  private async translateCarouselTexts() {
    const allTexts: string[] = [];
    this.carouselOriginalData.forEach((item) => {
      allTexts.push(item.title);
      allTexts.push(item.description);
    });

    const translatedTexts =
      await this.translateService.translateMultipleTexts(allTexts);

    if (translatedTexts.length !== allTexts.length) {
      this.carouselTranslatedSignal.set([...this.carouselOriginalData]);
      return;
    }

    const translatedData = [];
    let textIndex = 0;

    for (const originalItem of this.carouselOriginalData) {
      translatedData.push({
        ...originalItem,
        title: translatedTexts[textIndex] || originalItem.title,
        description: translatedTexts[textIndex + 1] || originalItem.description,
      });
      textIndex += 2;
    }
    this.carouselTranslatedSignal.set([...translatedData]);
  }

  private async translateNewsTexts() {
    const allTexts: string[] = [];
    this.newsOriginalData.forEach((item) => {
      allTexts.push(item.title);
      allTexts.push(item.description);
    });

    const translatedTexts =
      await this.translateService.translateMultipleTexts(allTexts);

    const translatedData = [];
    let textIndex = 0;

    for (const originalItem of this.newsOriginalData) {
      translatedData.push({
        ...originalItem,
        title: translatedTexts[textIndex++],
        description: translatedTexts[textIndex++],
      });
    }

    this.newsTranslatedSignal.set([...translatedData]);
  }

  loadCarouselOnly() {
    if (this.isCarouselLoaded()) return;
    this.carouselLoadingSignal.set(true);
    this.carrouselSrv
      .get()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.processCarouselImages(data);
          this.isCarouselLoaded.set(true);
        },
        error: (error) => {
          console.error('Error loading carousel:', error);
          this.carouselLoadingSignal.set(false);
        },
      });
  }

  loadNewsOnly() {
    if (this.isNewsLoaded()) return;

    this.newsLoadingSignal.set(true);
    this.carrouselSrv
      .get()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.processNewsImages(data);
          this.isNewsLoaded.set(true);
        },
        error: (error) => {
          console.error('Error loading news:', error);
          this.newsLoadingSignal.set(false);
        },
      });
  }

  private async processCarouselImages(data: HomeData[]) {
    try {
      const processedData = data.map((item) => {
        const mediaType: 'image' | 'video' = this.isVideoFile(item.photo)
          ? 'video'
          : 'image';

        // Usar CarrouselService para obtener la URL local
        const imageUrl = this.carrouselSrv.getImageUrl(item.photo);

        return {
          ...item,
          imageUrl,
          mediaType,
          imageLoaded: true,
        };
      });

      // Guardar datos originales
      this.carouselOriginalData = [...processedData];
      this.carouselSignal.set(processedData);
      this.carouselTranslatedSignal.set(processedData);

      // Si no es el idioma por defecto, traducir
      if (this.translocoService.getActiveLang() !== this.defaultLanguage) {
        await this.translateCarouselTexts();
      }
    } catch (error) {
      this.carouselOriginalData = [];
      this.carouselSignal.set([]);
      this.carouselTranslatedSignal.set([]);
    } finally {
      this.carouselLoadingSignal.set(false);
    }
  }

  private async processNewsImages(data: HomeData[]) {
    try {
      const processedData = data.map((item) => {
        const mediaType: 'image' | 'video' = this.isVideoFile(item.photo)
          ? 'video'
          : 'image';

        // Usar CarrouselService para obtener la URL local
        const imageUrl = this.carrouselSrv.getImageUrl(item.photo);

        return {
          ...item,
          imageUrl,
          mediaType,
          imageLoaded: true, // Ya está "cargada" porque es local
        };
      });

      // Guardar datos originales
      this.newsOriginalData = [...processedData];
      this.newsSignal.set(processedData);
      this.newsTranslatedSignal.set(processedData);

      // Si no es el idioma por defecto, traducir
      if (this.translocoService.getActiveLang() !== this.defaultLanguage) {
        await this.translateNewsTexts();
      }
    } catch (error) {
      this.newsOriginalData = [];
      this.newsSignal.set([]);
      this.newsTranslatedSignal.set([]);
    } finally {
      this.newsLoadingSignal.set(false);
    }
  }

  refreshAll() {
    this.loadCarouselOnly();
    this.loadNewsOnly();
    this.hasLoadedOnce = false;
    this.productsSignal.set([]);
    this.categoriesSignal.set([]);
    this.productsDataLoadedSignal.set(false);
    this.categoriesDataLoadedSignal.set(false);
    this.loadIfNeeded();
  }

  // ===== MÉTODOS DE PRODUCTOS Y CATEGORÍAS =====

  private async translateCategoriesInternal(): Promise<void> {
    try {
      const texts = this.categoriesOriginal.map((cat) => cat.title);
      const translatedTexts =
        await this.translateService.translateMultipleTexts(texts);
      const translatedCategories = this.categoriesOriginal.map((cat, i) => ({
        ...cat,
        title: translatedTexts[i] || cat.title,
      }));
      this.categoriesSignal.set(translatedCategories);
    } catch (error) {
      this.categoriesSignal.set([...this.categoriesOriginal]);
      throw error;
    }
  }

  private async translateProductsInternal(): Promise<void> {
    try {
      const translatedCategories = this.categoriesSignal();
      const categoryTranslationMap = new Map<string, string>();

      this.categoriesOriginal.forEach((originalCat, index) => {
        const translatedCat = translatedCategories[index];
        if (translatedCat) {
          categoryTranslationMap.set(originalCat.title, translatedCat.title);
        }
      });

      const texts: string[] = [];
      this.productsOriginal.forEach((product) => {
        texts.push(product.title);
        texts.push(product.description);
        product.variants.forEach((variant) => {
          texts.push(variant.description);
        });
      });

      const translatedTexts =
        await this.translateService.translateMultipleTexts(texts);

      let index = 0;
      const translatedProducts = this.productsOriginal.map((product) => {
        const title = translatedTexts[index++] || product.title;
        const description = translatedTexts[index++] || product.description;

        let originalCategoryTitle: string;
        if (typeof product.category === 'string') {
          originalCategoryTitle = product.category;
        } else if (
          typeof product.category === 'object' &&
          product.category !== null
        ) {
          const categoryObj = product.category as { title?: string };
          originalCategoryTitle = categoryObj.title || '';
        } else {
          originalCategoryTitle = '';
        }

        const translatedCategoryTitle =
          categoryTranslationMap.get(originalCategoryTitle) ||
          originalCategoryTitle;

        const variants = product.variants.map((variant) => {
          const variantDesc = translatedTexts[index++] || variant.description;
          return { ...variant, description: variantDesc };
        });

        return {
          ...product,
          title,
          description,
          category: translatedCategoryTitle,
          variants,
        };
      });

      this.productsSignal.set(translatedProducts);
    } catch (error) {
      this.productsSignal.set([...this.productsOriginal]);
      throw error;
    }
  }

  private async loadProducts() {
    this.productsLoadingSignal.set(true);

    try {
      const timeoutMs = this.isBrowser ? 30000 : 5000;

      const data: ProductData[] = await firstValueFrom(
        this.getProducts().pipe(
          timeout(timeoutMs),
          catchError((error) => {
            return of([]);
          }),
        ),
      );

      if (!data || data.length === 0) {
        this.productsSignal.set([]);
        this.productsDataLoadedSignal.set(true);
        this.productsLoadingSignal.set(false);
        return;
      }

      const productsWithLocalImages = data.map((item) => {
        let mediaType: 'image' | 'video' = 'image';
        let photoName = item.photo;

        if (item.files && item.files.length > 0) {
          const firstFile = item.files[0];
          const fileName = firstFile.media;
          mediaType = this.isVideoFile(fileName) ? 'video' : 'image';
          photoName = fileName;
        } else if (photoName) {
          mediaType = this.isVideoFile(photoName) ? 'video' : 'image';
        }

        const imageUrl = this.getImageUrl(photoName);

        return {
          ...item,
          imageUrl,
          mediaType,
          imageLoaded: true,
        };
      });

      this.productsOriginal = productsWithLocalImages;
      this.productsSignal.set(productsWithLocalImages);
      this.productsDataLoadedSignal.set(true);
      this.productsLoadingSignal.set(false);

      if (
        this.isBrowser &&
        this.translocoService.getActiveLang() !== this.defaultLanguage
      ) {
        await this.translateCategoriesInternal();
        await this.translateProductsInternal();
      }
    } catch (error) {
      this.productsSignal.set([]);
      this.productsLoadingSignal.set(false);
      this.productsDataLoadedSignal.set(true);
    }
  }

  private async loadCategories() {
    this.categoriesLoadingSignal.set(true);

    try {
      const timeoutMs = this.isBrowser ? 30000 : 5000;

      const data: CategoryData[] = await firstValueFrom(
        this.categorySrv.get().pipe(
          timeout(timeoutMs),
          catchError((error) => {
            return of([]);
          }),
        ),
      );

      this.categoriesOriginal = data;
      this.categoriesSignal.set(data);
      this.categoriesDataLoadedSignal.set(true);
      this.categoriesLoadingSignal.set(false);

      if (
        this.isBrowser &&
        this.translocoService.getActiveLang() !== this.defaultLanguage
      ) {
        this.translateCategoriesInternal();
      }
    } catch (error) {
      this.categoriesSignal.set([]);
      this.categoriesLoadingSignal.set(false);
      this.categoriesDataLoadedSignal.set(true);
    }
  }

  async loadIfNeeded(): Promise<void> {
    if (this.hasLoadedOnce) {
      return;
    }

    this.hasLoadedOnce = true;

    await Promise.all([this.loadProducts(), this.loadCategories()]);
  }

  // ===== MÉTODOS DE PRODUCT SERVICE (HTTP Y UTILIDADES) =====

  getProducts(): Observable<ProductData[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });
    const timestamp = new Date().getTime();
    return this.http.get<ProductData[]>(
      `${this.apiUrl}product/?no-cache=${timestamp}`,
      {
        headers,
      },
    );
  }

  // MÉTODO PARA OBTENER URL DE IMAGEN CON FALLBACK
  getImageUrl(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return this.getDefaultImageUrl();
    }
    return this.buildImageUrl(name);
  }

  // MÉTODO PARA OBTENER URL DE ARCHIVO
  getFileUrl(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return '';
    }
    return this.buildFileUrl(name);
  }

  // MÉTODO PARA OBTENER IMAGEN POR DEFECTO
  getDefaultImageUrl(): string {
    // Sin timestamp para permitir cacheo del navegador
    return `${environment.imgPath}img_default.webp`;
  }

  private buildImageUrl(photoName: string): string {
    // Sin timestamp para permitir cacheo del navegador

    // Si es una URL completa, retornarla directamente
    if (photoName.startsWith('http://') || photoName.startsWith('https://')) {
      return photoName;
    }

    // Si empieza con /, es ruta absoluta
    if (photoName.startsWith('/')) {
      return photoName;
    }

    // Ruta relativa - usar localImgPath
    return `${this.localImgPath}${photoName}`;
  }

  private buildFileUrl(fileName: string): string {
    // Sin timestamp para permitir cacheo del navegador

    // Para archivos, usar la misma lógica
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
      return fileName;
    }

    if (fileName.startsWith('/')) {
      return fileName;
    }

    return `${this.localImgPath}${fileName}`;
  }

  // Helper para detectar si es imagen por defecto
  isDefaultImage(url: string | null | undefined): boolean {
    if (!url || url.trim() === '') {
      return true;
    }
    return url.includes('img_default.webp');
  }

  // Helper para obtener extensión de archivo
  getFileExtension(fileName: string): string {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
  }
}
