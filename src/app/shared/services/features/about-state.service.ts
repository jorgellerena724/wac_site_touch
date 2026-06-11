import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { CompanyService } from './company.service';
import { ManagerService } from './manager.service';
import { ReviewService } from './review.service';
import { take, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HomeData } from '../../interfaces/homeData.interface';
import { LibreTranslateService } from '../system/libre-translate.service';
import { TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AboutStateService implements OnDestroy {
  private readonly defaultLanguage = environment.defaultLanguage;

  isCompanyLoaded = signal(false);
  isManagersLoaded = signal(false);
  isReviewsLoaded = signal(false);

  // Señales para datos traducidos
  private companyTranslatedSignal = signal<HomeData[]>([]);
  private managerTranslatedSignal = signal<HomeData[]>([]);
  private reviewTranslatedSignal = signal<HomeData[]>([]);

  // Datos originales en español
  private companyOriginalData: HomeData[] = [];
  private managerOriginalData: HomeData[] = [];
  private reviewOriginalData: HomeData[] = [];

  // Señales de estado de carga
  private companyLoadingSignal = signal<boolean>(true);
  private managerLoadingSignal = signal<boolean>(true);
  private reviewLoadingSignal = signal<boolean>(true);

  // Señal para estado de traducción
  isTranslating = signal(false);

  // Señales públicas computadas
  readonly companyWithImages$ = computed(() => this.companyTranslatedSignal());
  readonly managerWithImages$ = computed(() => this.managerTranslatedSignal());
  readonly reviewWithImages$ = computed(() => this.reviewTranslatedSignal());
  readonly isCompanyLoading$ = computed(() => this.companyLoadingSignal());
  readonly isManagerLoading$ = computed(() => this.managerLoadingSignal());
  readonly isReviewLoading$ = computed(() => this.reviewLoadingSignal());
  private destroy$ = new Subject<void>();

  constructor(
    private companySrv: CompanyService,
    private managerSrv: ManagerService,
    private reviewSrv: ReviewService,
    private translateService: LibreTranslateService,
    private translocoService: TranslocoService,
  ) {
    this.translocoService.langChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang) => {
        this.handleLanguageChange(lang);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleLanguageChange(lang: string) {
    if (lang === this.defaultLanguage) {
      this.companyTranslatedSignal.set([...this.companyOriginalData]);
      this.managerTranslatedSignal.set([...this.managerOriginalData]);
      this.reviewTranslatedSignal.set([...this.reviewOriginalData]);
    } else {
      this.translateAllDynamicTexts();
    }
  }

  async translateAllDynamicTexts(): Promise<void> {
    this.isTranslating.set(true);

    try {
      if (this.companyOriginalData.length > 0) {
        await this.translateCompanyTexts();
      }
      if (this.managerOriginalData.length > 0) {
        await this.translateManagerTexts();
      }
      if (this.reviewOriginalData.length > 0) {
        await this.translateReviewTexts();
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      this.isTranslating.set(false);
    }
  }

  private async translateCompanyTexts() {
    const allTexts: string[] = this.companyOriginalData.flatMap((item) => [
      item.title || '',
      item.description || '',
    ]);

    const translatedTexts =
      await this.translateService.translateMultipleTexts(allTexts);

    const translatedData = [];
    let textIndex = 0;

    for (const originalItem of this.companyOriginalData) {
      translatedData.push({
        ...originalItem,
        title: translatedTexts[textIndex++] || originalItem.title,
        description: translatedTexts[textIndex++] || originalItem.description,
      });
    }

    this.companyTranslatedSignal.set(translatedData);
  }

  private async translateManagerTexts() {
    const allTexts: string[] = this.managerOriginalData.flatMap((item) => [
      item.title || '',
      item.description || '',
    ]);

    const translatedTexts =
      await this.translateService.translateMultipleTexts(allTexts);

    const translatedData = [];
    let textIndex = 0;

    for (const originalItem of this.managerOriginalData) {
      translatedData.push({
        ...originalItem,
        title: translatedTexts[textIndex++] || originalItem.title,
        description: translatedTexts[textIndex++] || originalItem.description,
      });
    }

    this.managerTranslatedSignal.set(translatedData);
  }

  private async translateReviewTexts() {
    const allTexts: string[] = this.reviewOriginalData.flatMap((item) => [
      item.title || '',
      item.description || '',
    ]);

    const translatedTexts =
      await this.translateService.translateMultipleTexts(allTexts);

    const translatedData = [];
    let textIndex = 0;

    for (const originalItem of this.reviewOriginalData) {
      translatedData.push({
        ...originalItem,
        title: translatedTexts[textIndex++] || originalItem.title,
        description: translatedTexts[textIndex++] || originalItem.description,
      });
    }

    this.reviewTranslatedSignal.set(translatedData);
  }

  loadCompanyOnly() {
    if (this.isCompanyLoaded()) return;

    this.companyLoadingSignal.set(true);
    this.companySrv
      .get()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.processCompanyImages(data);
          this.isCompanyLoaded.set(true);
        },
        error: (error: any) => {
          this.companyTranslatedSignal.set([]);
          this.companyLoadingSignal.set(false);
        },
      });
  }

  loadManagerAndReview() {
    this.loadManagerOnly();
    this.loadReviewOnly();
  }

  loadManagerOnly() {
    if (this.isManagersLoaded()) return;

    this.managerLoadingSignal.set(true);
    this.managerSrv
      .get()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.processManagerImages(data);
          this.isManagersLoaded.set(true);
        },
        error: (error) => {
          this.managerTranslatedSignal.set([]);
          this.managerLoadingSignal.set(false);
        },
      });
  }

  loadReviewOnly() {
    if (this.isReviewsLoaded()) return;

    this.reviewLoadingSignal.set(true);
    this.reviewSrv
      .get()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.processReviewImages(data);
          this.isReviewsLoaded.set(true);
        },
        error: (error) => {
          this.reviewTranslatedSignal.set([]);
          this.reviewLoadingSignal.set(false);
        },
      });
  }

  private async processCompanyImages(data: HomeData[]) {
    try {
      const processedData = data.map((item) => {
        // Usar CompanyService para obtener la URL local
        const imageUrl = this.companySrv.getImageUrl(item.photo);

        return {
          ...item,
          imageUrl,
          imageLoaded: true,
        };
      });

      // Guardar datos originales
      this.companyOriginalData = [...processedData];
      this.companyTranslatedSignal.set(processedData);

      // Traducir si no es el idioma por defecto
      if (this.translocoService.getActiveLang() !== this.defaultLanguage) {
        await this.translateCompanyTexts();
      }
    } catch (error) {
      this.companyOriginalData = [];
      this.companyTranslatedSignal.set([]);
    } finally {
      this.companyLoadingSignal.set(false);
    }
  }

  private async processManagerImages(data: HomeData[]) {
    try {
      // CAMBIO CLAVE: Asignar URLs locales directamente (sin HTTP requests)
      const processedData = data.map((item) => {
        // Usar ManagerService para obtener la URL local
        const imageUrl = this.managerSrv.getImageUrl(item.photo);

        return {
          ...item,
          imageUrl,
          imageLoaded: true, // Ya está "cargada" porque es local
        };
      });

      // Guardar datos originales
      this.managerOriginalData = [...processedData];
      this.managerTranslatedSignal.set(processedData);

      // Traducir si no es el idioma por defecto
      if (this.translocoService.getActiveLang() !== this.defaultLanguage) {
        await this.translateManagerTexts();
      }
    } catch (error) {
      this.managerOriginalData = [];
      this.managerTranslatedSignal.set([]);
    } finally {
      this.managerLoadingSignal.set(false);
    }
  }

  private async processReviewImages(data: HomeData[]) {
    try {
      // CAMBIO CLAVE: Asignar URLs locales directamente (sin HTTP requests)
      const processedData = data.map((item) => {
        // Usar ReviewService para obtener la URL local
        const imageUrl = this.reviewSrv.getImageUrl(item.photo);

        return {
          ...item,
          imageUrl,
          imageLoaded: true, // Ya está "cargada" porque es local
        };
      });

      // Guardar datos originales
      this.reviewOriginalData = [...processedData];
      this.reviewTranslatedSignal.set(processedData);

      // Traducir si no es el idioma por defecto
      if (this.translocoService.getActiveLang() !== this.defaultLanguage) {
        await this.translateReviewTexts();
      }
    } catch (error) {
      this.reviewOriginalData = [];
      this.reviewTranslatedSignal.set([]);
    } finally {
      this.reviewLoadingSignal.set(false);
    }
  }

  refreshAll() {
    this.loadCompanyOnly();
    this.loadManagerOnly();
    this.loadReviewOnly();
  }

  // ===== MÉTODOS DE UTILIDAD PARA IMÁGENES =====
  getImageUrl(name: string | null | undefined): string {
    return this.managerSrv.getImageUrl(name);
  }

  getDefaultImageUrl(): string {
    return this.managerSrv.getDefaultImageUrl();
  }

  isDefaultImage(url: string | null | undefined): boolean {
    return this.managerSrv.isDefaultImage(url);
  }
}
