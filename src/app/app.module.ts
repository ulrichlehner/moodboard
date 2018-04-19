import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './/app-routing.module';
import { AppComponent } from './app.component';
import { ArtifactDetailComponent } from './artifact-detail/artifact-detail.component';
import { ArtifactListComponent } from './artifact-list/artifact-list.component';
import { CanvasComponent } from './canvas/canvas.component';
import { DataService } from './data.service';
import { MessageService } from './message.service';
import { MessagesComponent } from './messages/messages.component';
import { SpaceListComponent } from './space-list/space-list.component'; // Angular CLI environemnt
import { ArtifactEffects } from './store/effects/artifact.effects';
import { SpaceEffects } from './store/effects/space.effects';
import { reducers } from './store/reducers';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrashAlt, faEdit } from '@fortawesome/free-regular-svg-icons';

// Add an icon to the library for convenient access in other components
library.add(faTrashAlt, faEdit);

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
    NgbModule.forRoot(),
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([SpaceEffects, ArtifactEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    }),
    FontAwesomeModule
  ],
  providers: [DataService, MessageService],
  bootstrap: [AppComponent]
})
export class AppModule {}
