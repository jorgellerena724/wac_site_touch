import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Renderer2,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appBorderBeam]',
  standalone: true,
})
export class BorderBeamDirective implements OnInit, OnDestroy {
  @Input() beamColor: string = 'rgba(28, 119, 144, 0.6)';
  @Input() beamWidth: string = '2px';
  @Input() beamDuration: string = '4s';
  @Input() beamDelay: string = '0s';

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private beamElement?: HTMLElement;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.createBorderBeam();
    }
  }

  ngOnDestroy() {
    if (this.beamElement) {
      this.beamElement.remove();
    }
  }

  private createBorderBeam() {
    const host = this.el.nativeElement as HTMLElement;

    const position = window.getComputedStyle(host).position;
    if (position === 'static') {
      this.renderer.setStyle(host, 'position', 'relative');
    }

    this.renderer.setStyle(host, 'overflow', 'hidden');

    this.beamElement = this.renderer.createElement('div');
    this.renderer.addClass(this.beamElement, 'border-beam');

    this.renderer.setStyle(this.beamElement, 'position', 'absolute');
    this.renderer.setStyle(this.beamElement, 'inset', '0');
    this.renderer.setStyle(this.beamElement, 'pointer-events', 'none');
    this.renderer.setStyle(this.beamElement, 'z-index', '10');
    this.renderer.setStyle(this.beamElement, 'border-radius', 'inherit');

    const gradient = `
      conic-gradient(
        from 0deg,
        transparent 0deg,
        transparent 50deg,
        ${this.beamColor.replace(/[\d.]+\)$/, '0.2)')} 80deg,
        ${this.beamColor} 95deg,
        ${this.beamColor.replace(/[\d.]+\)$/, '0.2)')} 110deg,
        transparent 140deg,
        transparent 360deg
      )
    `;

    this.renderer.setStyle(this.beamElement, 'background', gradient);

    this.renderer.setStyle(
      this.beamElement,
      'mask',
      `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    );
    this.renderer.setStyle(
      this.beamElement,
      '-webkit-mask',
      `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    );
    this.renderer.setStyle(this.beamElement, 'mask-composite', 'exclude');
    this.renderer.setStyle(this.beamElement, '-webkit-mask-composite', 'xor');
    this.renderer.setStyle(this.beamElement, 'padding', this.beamWidth);

    this.renderer.setStyle(
      this.beamElement,
      'animation',
      `borderBeamRotate ${this.beamDuration} linear infinite`,
    );
    this.renderer.setStyle(this.beamElement, 'animation-delay', this.beamDelay);

    this.renderer.appendChild(host, this.beamElement);

    this.addKeyframes();
  }

  private addKeyframes() {
    const styleId = 'border-beam-keyframes';

    if (document.getElementById(styleId)) {
      return;
    }

    const style = this.renderer.createElement('style');
    this.renderer.setAttribute(style, 'id', styleId);
    const keyframes = `
      @keyframes borderBeamRotate {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `;
    this.renderer.appendChild(style, this.renderer.createText(keyframes));
    this.renderer.appendChild(document.head, style);
  }
}
