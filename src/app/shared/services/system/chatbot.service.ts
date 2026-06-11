import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatRequest {
  message: string;
  session_key?: string;
  user_context?: Record<string, any>;
  reset_conversation?: boolean;
}

export interface ChatResponse {
  response: string;
  session_key: string;
  model_used?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  suggestions?: string[];
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.api}chat/`;

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${environment.FRONT_TOKEN}`,
    });
  }

  /**
   * Envía un mensaje al chatbot
   */
  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http
      .post<ChatResponse>(`${this.baseUrl}`, request, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error enviando mensaje al chatbot:', error);
          return throwError(() => error);
        })
      );
  }
}
