import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArtifactListComponent } from './components/artifact-list/artifact-list.component';
import { CanvasComponent } from './components/canvas/canvas.component';

const routes: Routes = [
  { path: '', redirectTo: '/canvas', pathMatch: 'full' },
  { path: 'canvas', component: CanvasComponent },
  { path: 'artifacts', component: ArtifactListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
