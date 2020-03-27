import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ArtifactDetailComponent } from './components/artifact-detail/artifact-detail.component';
import { ArtifactListComponent } from './components/artifact-list/artifact-list.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { InfoComponent } from './components/info/info.component';
import { MessagesComponent } from './components/messages/messages.component';
import { SpaceDetailComponent } from './components/space-detail/space-detail.component';
import { SpaceListComponent } from './components/space-list/space-list.component'; // Angular CLI environemnt
import { TutorialComponent } from './components/tutorial/tutorial.component';
import { LayoutModule } from './layout/layout.module';
import { MessageService } from './message.service';
import { SelectableDirective } from './selectable.directive';
import { MoodboardStoreModule } from './store/moodboard-store.module';

@NgModule({
  declarations: [
    AppComponent,
    ArtifactListComponent,
    ArtifactDetailComponent,
    MessagesComponent,
    SpaceListComponent,
    CanvasComponent,
    TutorialComponent,
    SpaceDetailComponent,
    InfoComponent,
    SelectableDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    LayoutModule,
    MatChipsModule,
    MoodboardStoreModule
  ],
  providers: [MessageService],
  bootstrap: [AppComponent]
})
export class AppModule {}
