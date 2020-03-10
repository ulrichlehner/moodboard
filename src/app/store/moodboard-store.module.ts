import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { EntityDataModule, EntityDataService } from '@ngrx/data';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from 'src/environments/environment';
import { ArtifactDataService } from './artifact-data.service';
import { entityConfig } from './entity-metadata';
import {
  moodboardFeatureKey,
  moodboardReducer
} from './reducers/moodboard.reducers';
import { SpaceDataService } from './space-data.service';

@NgModule({
  declarations: [],
  imports: [
    HttpClientModule, // REMOVABLE?
    // StoreModule.forFeature(moodboardFeatureKey, moodboardReducer),
    // StoreModule.forRoot({ moodboard: moodboardReducer }),
    StoreModule.forFeature('activeSpace', moodboardReducer),
    EffectsModule.forRoot([]),
    EntityDataModule.forRoot(entityConfig),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    })
  ],
  providers: [SpaceDataService, ArtifactDataService]
})
export class MoodboardStoreModule {
  constructor(
    entityDataService: EntityDataService,
    spaceDataService: SpaceDataService,
    artifactDataService: ArtifactDataService
  ) {
    entityDataService.registerService('Space', spaceDataService);
    entityDataService.registerService('Artifcat', artifactDataService);
  }
}
