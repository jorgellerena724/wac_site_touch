import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appParallax]',
  standalone: true,
})
export class ParallaxDirective implements OnInit, OnDestroy {
  @Input() parallaxSpeed: number = 0.5;

  private ticking = false;
  private observer?: IntersectionObserver;
  private isVisible = false;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.el.nativeElement.style.willChange = 'transform';

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
          if (!this.isVisible) {
            this.el.nativeElement.style.willChange = 'auto';
          } else {
            this.el.nativeElement.style.willChange = 'transform';
          }
        });
      },
      { rootMargin: '50px' },
    );

    this.observer.observe(this.el.nativeElement);

    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  private onScroll = () => {
    if (!this.ticking && this.isVisible) {
      window.requestAnimationFrame(() => {
        this.updateParallax();
        this.ticking = false;
      });
      this.ticking = true;
    }
  };

  private updateParallax() {
    if (!this.isVisible) return;

    const scrollPosition = window.pageYOffset;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const elementPosition = rect.top + scrollPosition;

    const yPos = -(scrollPosition - elementPosition) * this.parallaxSpeed;
    this.el.nativeElement.style.transform = `translate3d(0, ${yPos}px, 0)`;
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll);
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
