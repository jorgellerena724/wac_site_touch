import {
  Component,
  ElementRef,
  Inject,
  viewChild,
  AfterViewChecked,
  DOCUMENT,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  ChatbotService,
  ChatRequest,
} from '../../services/system/chatbot.service';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLink?: boolean;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  templateUrl: './chat-widget.component.html',
})
export class ChatWidgetComponent implements AfterViewChecked {
  // Servicios inyectados
  private readonly chatbotService = inject(ChatbotService);
  private readonly translocoService = inject(TranslocoService);

  // ViewChild usando la nueva API de signal
  private readonly chatContainer = viewChild<ElementRef>('chatContainer');

  // Signals para el estado del componente
  readonly isChatOpen = signal(false);
  readonly chatMessages = signal<ChatMessage[]>([]);
  readonly chatMessage = signal('');
  readonly isBotTyping = signal(false);
  readonly chatStarted = signal(false);
  readonly showChatInMenu = signal(false);
  readonly isChatVisible = signal(false);
  readonly isComponentReady = signal(false);

  // Signal para manejo de sesión (manejada por el backend)
  private readonly sessionKey = signal<string | null>(null);

  // Signals para controlar el scroll automático
  private readonly previousMessageCount = signal(0);

  // Computed signals
  readonly hasMessages = computed(() => this.chatMessages().length > 0);
  readonly canSendMessage = computed(
    () => this.chatMessage().trim().length > 0
  );

  constructor(@Inject(DOCUMENT) private document: Document) {
    // Effect para scroll automático cuando cambian los mensajes
    effect(() => {
      const messages = this.chatMessages();
      const isOpen = this.isChatOpen();

      if (isOpen && messages.length !== this.previousMessageCount()) {
        this.previousMessageCount.set(messages.length);
        requestAnimationFrame(() => {
          this.scrollToBottom();
        });
      }
    });
  }

  ngAfterViewChecked() {
    // Ya no necesitamos lógica aquí gracias al effect
  }

  ngOnInit() {
    this.listenToOutsideClicks();
  }

  // Método trackBy para mensajes del chat
  trackByMessage(index: number, message: ChatMessage): string | number {
    if (message?.timestamp) {
      return `message_${message.timestamp.getTime()}_${index}`;
    }
    const fallbackId = `${message?.text || 'unknown'}_${
      message?.isUser ? 'user' : 'bot'
    }_${index}`;
    return fallbackId;
  }

  private listenToOutsideClicks() {
    this.document.addEventListener('pointerdown', (event) => {
      const target = event.target as HTMLElement;

      if (
        !target.closest('.chat-container') &&
        !target.closest('.fixed.bottom-8.right-8.group') &&
        !target.closest('.chat-toggle-app')
      ) {
        if (this.isChatOpen()) {
          this.isChatOpen.set(false);
          this.isChatVisible.set(true);
        }
      }
    });
  }

  toggleChat() {
    this.isChatOpen.update((open) => !open);

    if (this.isChatOpen()) {
      if (!this.isComponentReady()) {
        this.isComponentReady.set(true);
      }

      this.isChatVisible.set(true);
      this.showChatInMenu.set(false);

      setTimeout(() => this.scrollToBottom(), 100);
    } else {
      this.isChatVisible.set(true);
    }
  }

  private scrollToBottom() {
    try {
      const container = this.chatContainer();
      if (container && container.nativeElement) {
        const scrollContainer = container.nativeElement.querySelector(
          '.chat-messages-scroll-container'
        );

        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          return;
        }
      }

      const chatElement = this.document.querySelector('.chat-container');
      if (chatElement) {
        const scrollContainers =
          chatElement.querySelectorAll('[class*="scroll"]');
        for (const container of scrollContainers) {
          if (container.scrollHeight > container.clientHeight) {
            container.scrollTop = container.scrollHeight;
            return;
          }
        }
      }

      const allScrollContainers = this.document.querySelectorAll(
        '.chat-messages-scroll-container'
      );
      if (allScrollContainers.length > 0) {
        const lastContainer =
          allScrollContainers[allScrollContainers.length - 1];
        lastContainer.scrollTop = lastContainer.scrollHeight;
        return;
      }

      const allDivs = this.document.querySelectorAll('div');
      for (const div of allDivs) {
        if (
          div.classList.contains('chat-messages-scroll-container') ||
          div.classList.contains('chat-messages-area') ||
          (div.scrollHeight > div.clientHeight &&
            div.style.overflowY === 'auto')
        ) {
          div.scrollTop = div.scrollHeight;
          return;
        }
      }
    } catch (error) {
      // Error silencioso
    }
  }

  async sendMessage() {
    if (!this.canSendMessage()) return;

    const userMessage = this.chatMessage();

    // Agregar mensaje del usuario
    this.chatMessages.update((messages) => [
      ...messages,
      {
        text: userMessage,
        isUser: true,
        timestamp: new Date(),
      },
    ]);

    this.chatMessage.set('');
    this.isBotTyping.set(true);

    try {
      // Preparar el request
      const chatRequest: ChatRequest = {
        message: userMessage,
        session_key: this.sessionKey() || undefined,
        reset_conversation: false,
      };

      // Llamar al servicio
      this.chatbotService.sendMessage(chatRequest).subscribe({
        next: (response) => {
          this.isBotTyping.set(false);

          // Actualizar session key si viene del backend
          if (response.session_key) {
            this.sessionKey.set(response.session_key);
          }

          // Agregar respuesta del bot
          this.chatMessages.update((messages) => [
            ...messages,
            {
              text: response.response,
              isUser: false,
              timestamp: new Date(),
            },
          ]);

          // Agregar sugerencias si existen
          if (response.suggestions && response.suggestions.length > 0) {
            console.log('Sugerencias:', response.suggestions);
          }
        },
        error: (error) => {
          console.error('Error enviando mensaje:', error);
          this.isBotTyping.set(false);

          // Manejar diferentes tipos de errores
          let errorMessage =
            '😅 Oye… creo que me quedé sin internet. ¿Puedes intentar otra vez? 🔄';

          if (error.status === 403) {
            errorMessage = '⚠️ El chatbot no está disponible en este momento.';
          } else if (
            error.status === 400 &&
            error.error?.detail?.includes('sesión')
          ) {
            errorMessage =
              '⚠️ Tu sesión ha expirado. Iniciando nueva conversación...';
            this.sessionKey.set(null); // Resetear sesión
          }

          this.showErrorMessage(errorMessage);
        },
      });
    } catch (error) {
      console.error('Error inesperado:', error);
      this.isBotTyping.set(false);
      this.showErrorMessage(
        '😅 Oye… creo que me quedé sin internet. ¿Puedes intentar otra vez? 🔄'
      );
    }
  }

  public convertUrlsToLinks(text: string): string {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(
      urlRegex,
      '<a href="$1" target="_blank" class="text-blue-600 hover:text-blue-800 underline font-medium">$1</a>'
    );
  }

  startChat() {
    this.chatStarted.set(true);

    // Usar mensaje de bienvenida local traducido
    const welcomeMessage = this.translocoService.translate(
      'chat.welcome.message'
    );
    this.chatMessages.set([
      {
        text: welcomeMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  }

  clearChat() {
    // Limpiar estado local
    this.chatMessages.set([]);
    this.chatStarted.set(false);
    this.chatMessage.set('');
    this.sessionKey.set(null);
  }

  private showErrorMessage(message: string) {
    this.chatMessages.update((messages) => [
      ...messages,
      {
        text: message,
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  }

  showChat() {
    this.isChatVisible.set(true);
  }

  hideChat() {
    this.isChatVisible.set(false);
  }
}
