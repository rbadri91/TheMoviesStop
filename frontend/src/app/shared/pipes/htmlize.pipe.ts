import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** Converts \n newlines to <br> tags, mirrors the AngularJS htmlize filter. */
@Pipe({ name: 'htmlize', standalone: true })
export class HtmlizePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    return this.sanitizer.bypassSecurityTrustHtml(
      value.replace(/\n/g, '<br>')
    );
  }
}
