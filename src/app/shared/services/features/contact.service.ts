import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ContactData } from '../../interfaces/contactData.interface';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private apiUrl = environment.api;

  constructor(private http: HttpClient) {}

  get(): Observable<ContactData[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });

    const timestamp = new Date().getTime(); // Genera un timestamp único
    return this.http.get<ContactData[]>(
      `${this.apiUrl}contact/?no-cache=${timestamp}`,
      {
        headers,
      }
    );
  }

  send(data: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });

    return this.http.post(`${this.apiUrl}emails/`, data, { headers });
  }
}
