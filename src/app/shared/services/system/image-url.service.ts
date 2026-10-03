import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export type ImageKind = 'content' | 'user';

const DEFAULT_FILES: Record<ImageKind, string> = {
  content: 'img_default.webp',
  user: 'users_default.webp',
};

@Injectable({
  providedIn: 'root',
})
export class ImageUrlService {
  private readonly imgPath = environment.imgPath;
  private readonly staticImgPath = environment.staticImgPath;
  private readonly version = environment.BUILD_TS;

  image(name: string | null | undefined, kind: ImageKind = 'content'): string {
    if (!name || name.trim() === '') {
      return this.defaultImage(kind);
    }
    return this.withVersion(this.resolve(name));
  }

  file(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return '';
    }
    return this.withVersion(this.resolve(name));
  }

  defaultImage(kind: ImageKind = 'content'): string {
    return `${this.staticImgPath}${DEFAULT_FILES[kind]}${this.query()}`;
  }

  isDefaultImage(url: string | null | undefined): boolean {
    if (!url || url.trim() === '') {
      return true;
    }
    return Object.values(DEFAULT_FILES).some((file) => url.includes(file));
  }

  fileExtension(fileName: string | null | undefined): string {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
  }

  private resolve(name: string): string {
    if (name.startsWith('http://') || name.startsWith('https://')) {
      return name;
    }
    if (name.startsWith('/')) {
      return name;
    }
    return `${this.imgPath}${name}`;
  }

  private withVersion(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${this.version}`;
  }

  private query(): string {
    return `?v=${this.version}`;
  }
}