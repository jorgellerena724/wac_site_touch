import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HeaderData } from '../../interfaces/headerData.interface';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  // Signals para el estado
  private readonly _headerData = signal<HeaderData | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Computed values
  readonly headerData = this._headerData.asReadonly();
  readonly isLoading = computed(() => this._loading());
  readonly hasError = computed(() => this._error() !== null);
  readonly error = computed(() => this._error());

  private readonly apiUrl = environment.api;
  private readonly localImgPath = environment.imgPath;

  constructor(private http: HttpClient) {}

  // Observable para compatibilidad si es necesario
  readonly headerData$ = toObservable(this.headerData);

  // Cargar datos del header
  loadHeaderData(): void {
    this._loading.set(true);
    this._error.set(null);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });
    const timestamp = new Date().getTime();

    this.http
      .get<HeaderData[]>(`${this.apiUrl}header/?no-cache=${timestamp}`, {
        headers,
      })
      .pipe(
        map((data) => (data.length > 0 ? data[0] : null)),
        tap({
          next: (data) => {
            this._headerData.set(data);
            this._loading.set(false);
          },
          error: (error) => {
            console.error('Error loading header data:', error);
            this._error.set(error.message || 'Error al cargar los datos');
            this._loading.set(false);
          },
        }),
        catchError((error) => {
          console.error('Error loading header data:', error);
          this._error.set(error.message || 'Error al cargar los datos');
          this._loading.set(false);
          return of(null);
        })
      )
      .subscribe();
  }

  // Obtener URL de imagen
  getImageUrl(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return `${this.localImgPath}img_default.webp`;
    }
    return `${this.localImgPath}${name}`;
  }

  // Setear datos manualmente (útil para testing o inicialización)
  setHeaderData(data: HeaderData): void {
    this._headerData.set(data);
  }

  // Resetear estado
  reset(): void {
    this._headerData.set(null);
    this._loading.set(false);
    this._error.set(null);
  }
}
