import { Injectable } from '@angular/core';
import {
  EntityCollectionServiceBase,
  EntityCollectionServiceElementsFactory
} from '@ngrx/data';
import UUID from 'uuidjs';
import { Artifact } from '../models/artifact';
import { POUCH_DB_ARTIFACT_ID_PREFIX } from './pouch-db';

@Injectable({
  providedIn: 'root'
})
export class ArtifactService extends EntityCollectionServiceBase<Artifact> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Artifact', serviceElementsFactory);
  }

  public static generateId(spaceId: string): string {
    return `${POUCH_DB_ARTIFACT_ID_PREFIX}:${spaceId}:${UUID.generate()}`;
  }
}
