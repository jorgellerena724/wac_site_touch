import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LibreTranslateService {
  private apiUrl = 'https://traductor.shirkasoft.net/translate';
  private cache = new Map<string, string>();
  private translationQueue: {
    text: string;
    resolve: (value: string) => void;
  }[] = [];
  private isProcessing = false;
  isBrowser = false;
  private defaultLang = environment.defaultLanguage;

  constructor(
    private http: HttpClient,
    private transloco: TranslocoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Traducir textos individuales con manejo de cola
  async translateText(text: string): Promise<string> {
    if (!text) return text;

    const targetLang = this.transloco.getActiveLang();

    // No traducir si el idioma destino es el idioma por defecto
    if (targetLang === this.defaultLang) {
      return text;
    }
    const cacheKey = `${targetLang}:${text}`;

    // Verificar caché en memoria primero
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Verificar caché en localStorage solo en navegador
    if (this.isBrowser) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        this.cache.set(cacheKey, cached); // Almacenar en caché de memoria
        return cached;
      }
    }

    // Manejar traducciones en cola
    return new Promise<string>((resolve) => {
      this.translationQueue.push({ text, resolve });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  // Procesar cola de traducciones
  private async processQueue() {
    this.isProcessing = true;

    while (this.translationQueue.length > 0) {
      const batch = this.translationQueue.splice(0, 10); // Traducir en lotes de 10
      await this.processBatch(batch);
    }

    this.isProcessing = false;
  }

  // Procesar lote de textos
  private async processBatch(
    batch: { text: string; resolve: (value: string) => void }[]
  ) {
    try {
      const targetLang = this.transloco.getActiveLang();
      const texts = batch.map((item) => item.text);

      const body = {
        q: texts,
        source: this.defaultLang, // Usa el idioma por defecto como origen
        target: targetLang,
        format: 'text',
      };

      const response: any = await this.http.post(this.apiUrl, body).toPromise();

      // Procesar respuestas
      if (
        response &&
        response.translatedText &&
        Array.isArray(response.translatedText)
      ) {
        const translations = response.translatedText;

        translations.forEach((translatedText: string, index: number) => {
          if (batch[index]) {
            const cacheKey = `${targetLang}:${batch[index].text}`;

            // Almacenar en caché
            this.cache.set(cacheKey, translatedText);
            if (this.isBrowser) {
              localStorage.setItem(cacheKey, translatedText);
            }

            batch[index].resolve(translatedText);
          }
        });
      } else {
        // Si la respuesta no es válida, resolver con textos originales
        batch.forEach((item) => item.resolve(item.text));
      }
    } catch (error) {
      // Resolver con texto original en caso de error
      batch.forEach((item) => item.resolve(item.text));
    }
  }

  async translateMultipleTexts(texts: string[]): Promise<string[]> {
    if (!texts || texts.length === 0) return texts;

    const targetLang = this.transloco.getActiveLang();

    // No traducir si el idioma destino es el idioma x defecto
    if (targetLang === this.defaultLang) {
      return texts;
    }

    // Verificar caché para todos los textos
    const cacheKeys = texts.map((text) => `${targetLang}:${text}`);
    const cachedResults: string[] = [];
    const textsToTranslate: string[] = [];
    const indicesToTranslate: number[] = [];

    // Separar textos ya en caché de los que necesitan traducción
    cacheKeys.forEach((key, index) => {
      if (this.cache.has(key)) {
        cachedResults[index] = this.cache.get(key)!;
      } else if (this.isBrowser) {
        const cached = localStorage.getItem(key);
        if (cached) {
          this.cache.set(key, cached);
          cachedResults[index] = cached;
        } else {
          textsToTranslate.push(texts[index]);
          indicesToTranslate.push(index);
        }
      } else {
        textsToTranslate.push(texts[index]);
        indicesToTranslate.push(index);
      }
    });

    // Si todos están en caché, retornar inmediatamente
    if (textsToTranslate.length === 0) {
      return cachedResults;
    }

    try {
      const body = {
        q: textsToTranslate,
        source: this.defaultLang,
        target: targetLang,
        format: 'text',
      };

      const response: any = await this.http.post(this.apiUrl, body).toPromise();

      // Procesar respuestas
      if (
        response &&
        response.translatedText &&
        Array.isArray(response.translatedText) &&
        response.translatedText.length > 0
      ) {
        const translations = response.translatedText;

        translations.forEach((translatedText: string, i: number) => {
          if (indicesToTranslate[i] !== undefined) {
            const originalIndex = indicesToTranslate[i];
            const cacheKey = cacheKeys[originalIndex];

            // Almacenar en caché
            this.cache.set(cacheKey, translatedText);
            if (this.isBrowser) {
              localStorage.setItem(cacheKey, translatedText);
            }

            cachedResults[originalIndex] = translatedText;
          }
        });

        // Verificar que todos los índices estén completos
        indicesToTranslate.forEach((originalIndex, i) => {
          if (cachedResults[originalIndex] === undefined) {
            console.warn(
              `Índice ${originalIndex} no completado, usando texto original`
            );
            cachedResults[originalIndex] = textsToTranslate[i];
          }
        });

        return cachedResults;
      } else {
        // Si la respuesta no es válida o está vacía, usar textos originales
        indicesToTranslate.forEach((originalIndex, i) => {
          cachedResults[originalIndex] = textsToTranslate[i];
        });
        return cachedResults;
      }
    } catch (error) {
      // En caso de error, completar con textos originales
      indicesToTranslate.forEach((originalIndex, i) => {
        cachedResults[originalIndex] = textsToTranslate[i];
      });
      return cachedResults;
    }
  }
}
