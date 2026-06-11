import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input() revealAnimation: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' =
    'fade';
  @Input() revealDelay: number = 0;

  private isVisible = false;
  private checkTimeout?: number;
  private isBrowser: boolean;
  private observer?: IntersectionObserver;

  constructor(
    private el: ElementRef,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;

    this.el.nativeElement.style.transition = `opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${this.revealDelay}ms, transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${this.revealDelay}ms`;
    this.hide();
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isVisible) {
            this.reveal();
            this.isVisible = true;
          } else if (!entry.isIntersecting && this.isVisible) {
            this.hide();
            this.isVisible = false;
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -5% 0px',
      },
    );

    this.observer.observe(this.el.nativeElement);

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        this.checkTimeout = window.setTimeout(() => {
          this.checkVisibility();
        }, 50);
      });
    }
  }

  ngOnDestroy() {
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private checkVisibility() {
    if (!this.isBrowser || typeof window === 'undefined') return;

    const rect = this.el.nativeElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const isInViewport = rect.top < windowHeight * 0.95 && rect.bottom > 0;

    if (isInViewport && !this.isVisible) {
      this.reveal();
      this.isVisible = true;
    }
  }

  private reveal() {
    this.el.nativeElement.style.opacity = '1';
    this.el.nativeElement.style.transform = 'translate(0, 0)';
  }

  private hide() {
    this.el.nativeElement.style.opacity = '0';

    switch (this.revealAnimation) {
      case 'slide-up':
        this.el.nativeElement.style.transform = 'translateY(20px)';
        break;
      case 'slide-left':
        this.el.nativeElement.style.transform = 'translateX(30px)';
        break;
      case 'slide-right':
        this.el.nativeElement.style.transform = 'translateX(-30px)';
        break;
      default:
        this.el.nativeElement.style.transform = 'none';
    }
  }
}
