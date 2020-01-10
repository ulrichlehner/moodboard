import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ArtifactDetailComponent } from '@components/artifact-detail/artifact-detail.component';
import { ArtifactListComponent } from '@components/artifact-list/artifact-list.component';
import { CanvasComponent } from '@components/canvas/canvas.component';
import { MessagesComponent } from '@components/messages/messages.component';
import { SpaceListComponent } from '@components/space-list/space-list.component'; // Angular CLI environemnt
import { TutorialComponent } from '@components/tutorial/tutorial.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faEdit,
  faQuestionCircle,
  faTrashAlt
} from '@fortawesome/free-regular-svg-icons';
import {
  faCamera,
  faCompress,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { ArtifactEffects } from '@store/effects/artifact.effects';
import { SpaceEffects } from '@store/effects/space.effects';
import { reducers } from '@store/reducers';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DataService } from './data.service';
import { MessageService } from './message.service';
import { SpaceDetailComponent } from './components/space-detail/space-detail.component';
import { InfoComponent } from './components/info/info.component';

// Add an icon to the library for convenient access in other components
library.add(faTrashAlt, faEdit, faPlus, faCompress, faCamera, faQuestionCircle);

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
    NgbModule,
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
    FontAwesomeModule
  ],
  providers: [DataService, MessageService],
  bootstrap: [AppComponent]
})
export class AppModule {}
