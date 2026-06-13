import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HomeData } from '../../interfaces/homeData.interface';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = environment.api;
  private localImgPath = environment.imgPath;

  constructor(private http: HttpClient) {}

  get(filterByRating: boolean = false): Observable<HomeData[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });
    const timestamp = new Date().getTime();
    let url = `${this.apiUrl}reviews/?no-cache=${timestamp}`;
    /*if (filterByRating) {
      url += '&has_rating=true';
    }*/
    return this.http.get<HomeData[]>(url, { headers });
  }

  getImageUrl(name: string): string {
    if (!name) return `${this.localImgPath}img_default.webp`;

    return `${this.localImgPath}${name}`;
  }

  create(testimonial: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });
    return this.http.post<any>(`${this.apiUrl}reviews/`, testimonial, { headers });
  }

  post(formData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });
    return this.http.post<any>(`${this.apiUrl}reviews/`, formData, { headers });
  }
}
