import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LibreTranslateService } from '../../../shared/services/system/libre-translate.service';
import { TERMS_DATA, TermsItem } from '../../../shared/constants/terms.data';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './terms.component.html',
})
export class TermsComponent implements OnInit {
  readonly currentYear = new Date().getFullYear();
  readonly termsData = signal<TermsItem[]>(TERMS_DATA);
  readonly isTranslating = signal(false);

  private readonly originalData: TermsItem[] = TERMS_DATA;
  private readonly translateService = inject(LibreTranslateService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    const activeLang = this.transloco.getActiveLang();
    if (activeLang !== 'en') {
      this.translateAllTexts();
    }

    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.translateAllTexts());
  }

  private async translateAllTexts(): Promise<void> {
    const targetLang = this.transloco.getActiveLang();
    if (targetLang === 'en') {
      this.termsData.set(this.originalData);
      return;
    }

    this.isTranslating.set(true);

    const allTexts: string[] = this.originalData.flatMap((item) => [
      item.title,
      item.content,
    ]);

    const translatedTexts = await this.translateService.translateMultipleTexts(allTexts);

    const translated: TermsItem[] = this.originalData.map((_, i) => ({
      title: translatedTexts[i * 2] || this.originalData[i].title,
      content: translatedTexts[i * 2 + 1] || this.originalData[i].content,
    }));

    this.termsData.set(translated);
    this.isTranslating.set(false);
  }
}
