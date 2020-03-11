import { Injectable } from '@angular/core';
import {
  EntityCollectionServiceBase,
  EntityCollectionServiceElementsFactory
} from '@ngrx/data';
import UUID from 'uuidjs';
import { Space } from '../models/space';
import { POUCH_DB_SPACE_ID_PREFIX } from './pouch-db';

@Injectable({
  providedIn: 'root'
})
export class SpaceService extends EntityCollectionServiceBase<Space> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Space', serviceElementsFactory);
  }

  public static generateId(): string {
    return `${POUCH_DB_SPACE_ID_PREFIX}:${UUID.generate()}`;
  }
}
