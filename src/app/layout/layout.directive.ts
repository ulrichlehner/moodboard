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
 * The supported Material typography types
 *
 * @see
 * {@link https://material.angular.io/guide/typography}
 */
export type LayoutTypographyType =
  | 'display-1'
  | 'display-2'
  | 'display-3'
  | 'display-4'
  | 'headline'
  | 'title'
  | 'subheading-1'
  | 'subheading-2'
  | 'body-1'
  | 'body-2'
  | 'caption'
  | 'button'
  | 'input';

/**
 * Directive to apply consistent spacing
 */
@Directive({
  selector: `
    [appLayout],
    [spacing],
    [width],
    [textMuted],
    [textDisabled],
    [textCenter],
    [matTypography],
    [matDisplay1],
    [matDisplay2],
    [matDisplay3],
    [matDisplay4],
    [matHeadline],
    [matTitle],
    [matSubheading1],
    [matSubheading2],
    [matBody1],
    [matBody2],
    [matButton]
    [matCaption],
    [matInput]
  `
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
   * Apply muted text style
   */
  @Input() textMuted?;

  /**
   * Apply disabled text style
   */
  @Input() textDisabled?;

  /**
   * Apply centered text style
   */
  @Input() textCenter?;

  /**
   * Apply typography
   */
  @Input() matTypography?;

  /**
   * Apply `display-1` text style
   */
  @Input() matDisplay1?;

  /**
   * Apply `display-2` text style
   */
  @Input() matDisplay2?;

  /**
   * Apply `display-3` text style
   */
  @Input() matDisplay3?;

  /**
   * Apply `display-4` text style
   */
  @Input() matDisplay4?;

  /**
   * Apply `headline` text style
   */
  @Input() matHeadline?;

  /**
   * Apply `title` text style
   */
  @Input() matTitle?;

  /**
   * Apply `subheading-1` text style
   */
  @Input() matSubheading1?;

  /**
   * Apply `subheading-2` text style
   */
  @Input() matSubheading2?;

  /**
   * Apply `body-1` text style
   */
  @Input() matBody1?;

  /**
   * Apply `body-2` text style
   */
  @Input() matBody2;

  /**
   * Apply `caption` text style
   */
  @Input() matCaption?;

  /**
   * Apply `button` text style
   */
  @Input() matButton?;

  /**
   * Apply `input` text style
   */
  @Input() matInput?;

  // private readonly inputNameToTypographyType: {
  //   [key: string]: LayoutTypographyType;
  // } = {
  //   display1: 'display-1',
  //   display2: 'display-2',
  //   display3: 'display-3',
  //   display4: 'display-4',
  //   headline: 'headline',
  //   title: 'title',
  //   subheading1: 'subheading-1',
  //   subheading2: 'subheading-2',
  //   body1: 'body-1',
  //   body2: 'body-2',
  //   caption: 'caption',
  //   button: 'button',
  //   input: 'input'
  // };

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.spacing) {
      this.applySpacing();
    }

    if (changes.width) {
      this.applyWidth();
    }

    if (changes.textMuted) {
      this.applyTextMuted();
    } else if (changes.textDisabled) {
      this.applyTextDisabled();
    }

    if (changes.textCenter) {
      this.applyTextAlign('center');
    }

    if (changes.matTypography) {
      this.applyTypography();
    }

    if (changes.matBody1) {
      this.applyTypography('body-1');
    } else if (changes.matBody2) {
      this.applyTypography('body-2');
    } else if (changes.matDisplay1) {
      this.applyTypography('display-1');
    } else if (changes.matDisplay2) {
      this.applyTypography('display-2');
    } else if (changes.matDisplay3) {
      this.applyTypography('display-3');
    } else if (changes.matDisplay4) {
      this.applyTypography('display-4');
    } else if (changes.matHeadline) {
      this.applyTypography('headline');
    } else if (changes.matTitle) {
      this.applyTypography('title');
    } else if (changes.matSubheading1) {
      this.applyTypography('subheading-1');
    } else if (changes.matSubheading2) {
      this.applyTypography('subheading-2');
    } else if (changes.matCaption) {
      this.applyTypography('caption');
    } else if (changes.matButton) {
      this.applyTypography('button');
    } else if (changes.matInput) {
      this.applyTypography('input');
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

  private applyTypography(type?: LayoutTypographyType) {
    this.renderer.addClass(
      this.el.nativeElement,
      type ? `mat-${type}` : 'mat-typography'
    );
    this.renderer.setStyle(this.el.nativeElement, 'color', '#ffffff');
  }

  private applyTextMuted() {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.6');
  }

  private applyTextDisabled() {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.3');
  }

  private applyTextAlign(align: 'center') {
    this.renderer.setStyle(this.el.nativeElement, 'text-align', align);
  }
}
