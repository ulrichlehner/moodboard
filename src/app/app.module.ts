import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ArtifactDetailComponent } from '@components/artifact-detail/artifact-detail.component';
import { ArtifactListComponent } from '@components/artifact-list/artifact-list.component';
import { CanvasComponent } from '@components/canvas/canvas.component';
import { MessagesComponent } from '@components/messages/messages.component';
import { SpaceListComponent } from '@components/space-list/space-list.component'; // Angular CLI environemnt
import { TutorialComponent } from '@components/tutorial/tutorial.component';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { ArtifactEffects } from '@store/effects/artifact.effects';
import { SpaceEffects } from '@store/effects/space.effects';
import { reducers } from '@store/reducers';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InfoComponent } from './components/info/info.component';
import { SpaceDetailComponent } from './components/space-detail/space-detail.component';
import { DataService } from './data.service';
import { MessageService } from './message.service';
import { MatListModule } from '@angular/material/list';

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
    InfoComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([SpaceEffects, ArtifactEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    }),
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    // MatMenuModule
    MatSidenavModule
  ],
  providers: [DataService, MessageService],
  bootstrap: [AppComponent]
})
export class AppModule {}
