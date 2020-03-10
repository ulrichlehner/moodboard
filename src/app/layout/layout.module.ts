import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LayoutDirective } from './layout.directive';

@NgModule({
  declarations: [LayoutDirective],
  imports: [CommonModule, FlexLayoutModule],
  exports: [FlexLayoutModule, LayoutDirective]
})
export class LayoutModule {}
