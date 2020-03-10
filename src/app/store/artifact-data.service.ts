import { Injectable } from '@angular/core';
import { EntityCollectionDataService } from '@ngrx/data';
import { Observable } from 'rxjs';
import { Artifact } from '../models/artifact';

@Injectable()
export class ArtifactDataService
  implements EntityCollectionDataService<Artifact> {
  name = 'Artifact';

  add(entity: Artifact): Observable<Artifact> {
    throw new Error('Method not implemented.');
  }

  delete(id: string | number): Observable<string | number> {
    throw new Error('Method not implemented.');
  }

  getAll(): Observable<Artifact[]> {
    throw new Error('Method not implemented.');
  }

  getById(id: any): Observable<Artifact> {
    throw new Error('Method not implemented.');
  }

  getWithQuery(
    params: string | import('@ngrx/data').QueryParams
  ): Observable<Artifact[]> {
    throw new Error('Method not implemented.');
  }

  update(
    update: import('@ngrx/entity').Update<Artifact>
  ): Observable<Artifact> {
    throw new Error('Method not implemented.');
  }

  upsert(entity: Artifact): Observable<Artifact> {
    throw new Error('Method not implemented.');
  }
}
