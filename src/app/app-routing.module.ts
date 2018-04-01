import { CanvasComponent } from './canvas/canvas.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ArtifactListComponent } from './artifact-list/artifact-list.component';

const routes: Routes = [
  { path: '', redirectTo: '/canvas', pathMatch: 'full' },
  { path: 'canvas', component: CanvasComponent },
  { path: 'artifacts', component: ArtifactListComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
