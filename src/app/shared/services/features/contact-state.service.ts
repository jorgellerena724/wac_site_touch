import { Injectable, signal, computed } from '@angular/core';
import { take } from 'rxjs';
import { ContactData } from '../../interfaces/contactData.interface';
import { ContactService } from './contact.service';

@Injectable({ providedIn: 'root' })
export class ContactStateService {
  // Señales internas
  private contactSignal = signal<ContactData[]>([]);

  // Señales de estado de carga
  private contactLoadingSignal = signal<boolean>(false);

  // Signal para controlar si ya se cargaron los datos
  private contactLoadedSignal = signal<boolean>(false);

  // Señales públicas computadas
  readonly contact$ = computed(() => this.contactSignal());
  readonly isContactLoading$ = computed(() => this.contactLoadingSignal());
  readonly isContactLoaded$ = computed(() => this.contactLoadedSignal());

  constructor(private contactSrv: ContactService) {}

  /**
   * Carga los datos de contacto desde el servicio
   * Esta función es privada y se llama internamente
   */
  private loadContact(): void {
    this.contactLoadingSignal.set(true);

    this.contactSrv
      .get()
      .pipe(take(1))
      .subscribe({
        next: (data: ContactData[]) => {
          this.contactSignal.set(data);
          this.contactLoadingSignal.set(false);
          this.contactLoadedSignal.set(true);
        },
        error: (error) => {
          console.error('Error cargando contacto:', error);
          this.contactSignal.set([]);
          this.contactLoadingSignal.set(false);
          this.contactLoadedSignal.set(false);
        },
      });
  }

  /**
   * Carga los datos de contacto solo si no han sido cargados previamente
   * Esta es la función que debes llamar desde el componente
   */
  loadContactData(): void {
    if (!this.contactLoadedSignal()) {
      this.loadContact();
    }
  }

  /**
   * Fuerza la recarga de los datos de contacto
   * Útil para refrescar datos después de una actualización
   */
  refresh(): void {
    this.contactSignal.set([]);
    this.contactLoadedSignal.set(false);
    this.loadContact();
  }

  /**
   * Limpia todos los datos y estados
   */
  clear(): void {
    this.contactSignal.set([]);
    this.contactLoadingSignal.set(false);
    this.contactLoadedSignal.set(false);
  }
}
