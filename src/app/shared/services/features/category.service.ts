import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CategoryData } from '../../interfaces/productData.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = environment.api;

  constructor(private http: HttpClient) {}

  get(): Observable<CategoryData[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });

    const timestamp = new Date().getTime(); // Genera un timestamp único
    return this.http.get<CategoryData[]>(
      `${this.apiUrl}category/?no-cache=${timestamp}`,
      {
        headers,
      }
    );
  }
}
