import { Injectable } from '@angular/core';
import {
  EntityCollectionServiceBase,
  EntityCollectionServiceElementsFactory
} from '@ngrx/data';
import { Space } from '../models/space';

@Injectable({
  providedIn: 'root'
})
export class SpaceService extends EntityCollectionServiceBase<Space> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Space', serviceElementsFactory);
  }
}
