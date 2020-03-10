import { Injectable } from '@angular/core';
import {
  EntityCollectionServiceBase,
  EntityCollectionServiceElementsFactory
} from '@ngrx/data';
import { Artifact } from '../models/artifact';

@Injectable({
  providedIn: 'root'
})
export class ArtifactService extends EntityCollectionServiceBase<Artifact> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Artifact', serviceElementsFactory);
  }
}
