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


}
