import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HomeData } from '../../interfaces/homeData.interface';

@Injectable({
  providedIn: 'root',
})
export class ManagerService {
  private apiUrl = environment.api;
  private localImgPath = environment.imgPath;

  constructor(private http: HttpClient) {}

  get(): Observable<HomeData[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });
    const timestamp = new Date().getTime();
    return this.http.get<HomeData[]>(
      `${this.apiUrl}manager/?no-cache=${timestamp}`,
      {
        headers,
      },
    );
  }

  getImageUrl(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return this.getDefaultImageUrl();
    }

    return `${this.localImgPath}${name}`;
  }

  getDefaultImageUrl(): string {
    return `${this.localImgPath}users_default.webp`;
  }

  isDefaultImage(url: string | null | undefined): boolean {
    if (!url || url.trim() === '') {
      return true;
    }
    return url.includes('users_default.webp');
  }
}
