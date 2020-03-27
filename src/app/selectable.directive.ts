import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges
} from '@angular/core';
import { toBoolean } from './functions';

type SelectableType = boolean | 'all' | '';

/**
 * A directive to opt-in for text-selection as the web-app has CSS property `user-select` set to `false` globally.
 */
@Directive({
  selector: '[appSelectable], [selectable]'
})
export class SelectableDirective implements OnChanges {
  /**
   * Sets the selectable behaviour.
   * Use `selectable="all"` to allow that one click selects the complete text.
   */
  @Input('selectable')
  get isSelectable() {
    return this._isSelectable;
  }
  set isSelectable(value: SelectableType) {
    if (value === 'all') {
      this._isSelectable = value;
    } else {
      this._isSelectable = toBoolean(value);
    }
  }
  // tslint:disable-next-line: variable-name
  private _isSelectable: SelectableType = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isSelectable) {
      if (this.isSelectable) {
        this.renderer.addClass(this.el.nativeElement, 'enable-selection');

        if (this.isSelectable === 'all') {
          this.renderer.addClass(
            this.el.nativeElement,
            'enable-selection--all'
          );
        }
      } else {
        this.renderer.removeClass(this.el.nativeElement, 'enable-selection');

        this.renderer.removeClass(
          this.el.nativeElement,
          'enable-selection--all'
        );
      }
    }
  }
}
