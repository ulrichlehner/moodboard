import { ArtifactEffects } from './store/effects/artifact.effects';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { ArtifactListComponent } from './artifact-list/artifact-list.component';
import { ArtifactDetailComponent } from './artifact-detail/artifact-detail.component';
import { ArtifactService } from './artifact.service';
import { MessagesComponent } from './messages/messages.component';
import { MessageService } from './message.service';
import { AppRoutingModule } from './/app-routing.module';
import { StoreModule } from '@ngrx/store';
import { reducers } from './store/reducers';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { SpaceListComponent } from './space-list/space-list.component'; // Angular CLI environemnt
import { EffectsModule } from '@ngrx/effects';
import { CanvasComponent } from './canvas/canvas.component';

@NgModule({
  declarations: [
    AppComponent,
    ArtifactListComponent,
    ArtifactDetailComponent,
    MessagesComponent,
    SpaceListComponent,
    CanvasComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([ArtifactEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    })
  ],
  providers: [
    ArtifactService,
    MessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
