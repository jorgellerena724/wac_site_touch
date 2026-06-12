import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  ViewContainerRef,
  ComponentRef,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ModalService, ModalConfig } from '../../services/system/modal.service';
import { NotificationService } from '../../services/system/notification.service';
import { DynamicComponent } from '../../interfaces/dynamic.interface';

@Component({
  selector: 'app-modal',
  templateUrl: './app-modal.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  // Services
  private readonly modalService = inject(ModalService);
  private readonly notificationSrv = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  readonly container = viewChild.required('dynamicContent', {
    read: ViewContainerRef,
  });

  // State Signals
  readonly visible = signal(false);
  readonly title = signal('');
  readonly isProcessing = signal(false);
  readonly isLoading = signal(false);
  readonly currentConfig = signal<ModalConfig | null>(null);

  // Referencia al componente dinámico (no puede ser signal porque es mutable internamente por Angular)
  private componentRef: ComponentRef<any> | null = null;

  constructor() {
    // Escuchar configuración del modal (Zoneless way con takeUntilDestroyed)
    this.modalService.modalConfig$
      .pipe(takeUntilDestroyed())
      .subscribe((config) => {
        this.openModal(config);
      });

    // Escuchar cierre del modal
    this.modalService.close$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.closeModal();
    });
  }

  private openModal(config: ModalConfig): void {
    this.title.set(config.title);
    this.currentConfig.set(config);
    this.visible.set(true);
    this.isProcessing.set(false);

    // Pequeño delay para asegurar que el DOM del modal se renderizó (por el *ngIf="visible")
    // y el contenedor dinámico existe.
    setTimeout(() => {
      this.loadComponent(config);
    }, 50);
  }

  private loadComponent(config: ModalConfig): void {
    const viewContainer = this.container();

    if (!viewContainer) {
      return;
    }

    try {
      viewContainer.clear();
      // Destruir referencia anterior si existe
      if (this.componentRef) {
        this.componentRef.destroy();
      }

      // Crear componente
      this.componentRef = viewContainer.createComponent(config.component);

      // Asignar datos usando setInput (Modern Angular)
      if (config.data) {
        Object.entries(config.data).forEach(([key, value]) => {
          this.componentRef?.setInput(key, value);
        });
      }

      // Manejar eventos del componente dinámico
      this.setupDynamicComponentEvents();

    } catch (error) {
      this.closeModal();
    }
  }

  private setupDynamicComponentEvents(): void {
    if (!this.componentRef) return;
    const instance = this.componentRef.instance;

    // 1. OBTENER EL DESTROYREF DEL HIJO
    // Extraemos el DestroyRef específico de este componente dinámico usando su inyector
    const childDestroyRef = this.componentRef.injector.get(DestroyRef);

    // Si tiene output de éxito (submitSuccess)
    if (instance.submitSuccess) {
      instance.submitSuccess
        .pipe(takeUntilDestroyed(childDestroyRef)) // <--- USA LA REFERENCIA EXTRAÍDA
        .subscribe(() => {
          this.isProcessing.set(false);
          this.closeModal();
        });
    }

    // Si tiene output de error (submitError)
    if (instance.submitError) {
      instance.submitError
        .pipe(takeUntilDestroyed(childDestroyRef)) // <--- USA LA REFERENCIA EXTRAÍDA
        .subscribe(() => {
          this.isProcessing.set(false);
          this.isLoading.set(false);
        });
    }
  }

  onAccept(): void {
    if (this.isProcessing() || !this.componentRef) return;

    const instance = this.componentRef.instance;

    if (!this.isDynamicComponent(instance)) return;

    // Validación de formularios reactivos
    if (instance['form']) {
      instance['form'].markAllAsTouched();
      if (!instance['form'].valid) {
        this.notificationSrv.addNotification(
          this.transloco.translate('notifications.products.error.formInvalid'),
          'warning',
        );
        return;
      }
    }

    this.isProcessing.set(true);
    this.isLoading.set(true);

    try {
      instance.onSubmit();
    } catch (error) {
      this.isProcessing.set(false);
      this.isLoading.set(false);
    }
  }

  closeModal(): void {
    this.visible.set(false);
    this.isProcessing.set(false);
    this.isLoading.set(false);
    this.currentConfig.set(null);

    // Limpieza
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
    this.container().clear();
  }

  // Helpers de Estilo (Actualizados para Signals)
  getModalSizeClass(): string {
    return 'w-full max-w-lg sm:max-w-4xl';
  }

  getModalHeightClass(): string {
    return 'max-h-[95vh] sm:max-h-[90vh]';
  }

  getContentMaxHeight(): string {
    return 'max-h-[70vh]'; // Ajustado para mejor UX general
  }

  private isDynamicComponent(instance: any): instance is DynamicComponent {
    return typeof instance?.onSubmit === 'function';
  }
}
