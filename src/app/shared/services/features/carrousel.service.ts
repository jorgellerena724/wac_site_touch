import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HomeData } from '../../interfaces/homeData.interface';

@Injectable({
  providedIn: 'root',
})
export class CarrouselService {
  private apiUrl = environment.api;
  private localImgPath = environment.imgPath;

  constructor(private http: HttpClient) {}

  get(): Observable<HomeData[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });
    const timestamp = new Date().getTime();
    return this.http.get<HomeData[]>(
      `${this.apiUrl}carrousel/?no-cache=${timestamp}`,
      {
        headers,
      }
    );
  }

  getImageUrl(name: string): string {
    if (!name) return `${this.localImgPath}img_default.webp`;

    return `${this.localImgPath}${name}`;
  }
}
