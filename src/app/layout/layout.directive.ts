import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges
} from '@angular/core';
import { layoutSpacing } from './layout.config';

/**
 * The supported spacing types
 */
export type LayoutSpacingType =
  | 'p-x'
  | 'p-y'
  | 'm-x'
  | 'm-y'
  | 'm'
  | 'p'
  | undefined;

/**
 * The supported width types
 */
export type LayoutWidthType = 'sidebar' | 'dialog' | undefined;

/**
 * Directive to apply consistent spacing
 */
@Directive({
  selector: '[appLayout], [spacing], [width], [typography]'
})
export class LayoutDirective implements OnChanges {
  /**
   * Apply spacing
   */
  @Input() spacing: LayoutSpacingType;

  /**
   * Apply width
   */
  @Input() width: LayoutWidthType;

  /**
   * Apply typography
   */
  @Input() typography: any | undefined;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['spacing']) {
      this.applySpacing();
    }

    if (changes['width']) {
      this.applyWidth();
    }

    if (changes['typography']) {
      this.applyTypography();
    }
  }

  private applySpacing() {
    switch (this.spacing) {
      case 'm':
        this.renderer.setStyle(
          this.el.nativeElement,
          'margin',
          `${layoutSpacing}px`
        );
        break;
      case 'm-x':
        this.renderer.setStyle(
          this.el.nativeElement,
          'margin-left',
          `${layoutSpacing}px`
        );
        this.renderer.setStyle(
          this.el.nativeElement,
          'margin-right',
          `${layoutSpacing}px`
        );
        break;
      case 'm-y':
        this.renderer.setStyle(
          this.el.nativeElement,
          'margin-top',
          `${layoutSpacing}px`
        );
        this.renderer.setStyle(
          this.el.nativeElement,
          'margin-bottom',
          `${layoutSpacing}px`
        );
        break;
      case 'p':
        this.renderer.setStyle(
          this.el.nativeElement,
          'padding',
          `${layoutSpacing}px`
        );
        break;
      case 'p-x':
        this.renderer.setStyle(
          this.el.nativeElement,
          'padding-left',
          `${layoutSpacing}px`
        );
        this.renderer.setStyle(
          this.el.nativeElement,
          'padding-right',
          `${layoutSpacing}px`
        );
        break;
      case 'p-y':
        this.renderer.setStyle(
          this.el.nativeElement,
          'padding-top',
          `${layoutSpacing}px`
        );
        this.renderer.setStyle(
          this.el.nativeElement,
          'padding-bottom',
          `${layoutSpacing}px`
        );
        break;
      default:
        console.warn('Cannot apply spacing due to unknown spacing type');
    }
  }

  private applyWidth() {
    switch (this.width) {
      case 'sidebar':
        this.renderer.setStyle(this.el.nativeElement, 'width', `320px`);
        break;
      case 'dialog':
        this.renderer.setStyle(this.el.nativeElement, 'width', `480px`);
        break;
      default:
        console.warn('Cannot width spacing due to unknown width type');
    }
  }

  private applyTypography() {
    this.renderer.addClass(this.el.nativeElement, 'mat-typography');
    this.renderer.setStyle(this.el.nativeElement, 'color', '#ffffff');
  }
}
