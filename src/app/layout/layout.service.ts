import { Injectable } from '@angular/core';
import { layoutSpacing } from './layout.config';

/**
 * Service to access layout values
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  /**
   * The default layout spacing in `px`
   */
  public get spacing() {
    return `${layoutSpacing}px`;
  }

  constructor() {}
}
