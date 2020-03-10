import { Injectable } from '@angular/core';
import { EntityCollectionDataService, QueryParams } from '@ngrx/data';
import { Update } from '@ngrx/entity';
import PouchDB from 'pouchdb';
import { from, Observable, of } from 'rxjs';
import { catchError, concatAll, concatMap, map, reduce } from 'rxjs/operators';
import { Artifact } from '../models/artifact';
import {
  IPouchDBAllDocsResult,
  POUCH_DB_ARTIFACT_ID_PREFIX,
  POUCH_DB_NAME
} from './pouch-db';

@Injectable()
export class ArtifactDataService
  implements EntityCollectionDataService<Artifact> {
  name = 'Artifact';

  private db: any; // PouchDB.Database;

  constructor() {
    this.db = new PouchDB(POUCH_DB_NAME, { auto_compaction: true });
  }

  add(entity: Artifact): Observable<Artifact> {
    return from(
      this.db.put({
        ...entity,
        _id: entity.id
      }) as Observable<Artifact>
    );
  }

  delete(id: string | number): Observable<string | number> {
    return from(
      this.db
        .get(id)
        .then(doc => this.db.remove(id, doc._rev))
        .then(() => {
          return Promise.resolve(id);
        })
    ) as Observable<string | number>;
  }

  getAll(): Observable<Artifact[]> {
    throw new Error('Method not implemented.');
  }

  getById(id: any): Observable<Artifact> {
    return from(this.db.get(id)) as Observable<Artifact>;
  }

  getWithQuery(params: string | QueryParams): Observable<Artifact[]> {
    if (typeof params === 'string' || !('spaceId' in params)) {
      throw new Error('Query not supported');
    }

    // see https://codereview.stackexchange.com/questions/152897/switchmap-with-array-of-observables
    return from(
      this.db.allDocs({
        include_docs: true,
        startkey: `${POUCH_DB_ARTIFACT_ID_PREFIX}:${params.spaceId}`,
        endkey: `${POUCH_DB_ARTIFACT_ID_PREFIX}:${params.spaceId}\ufff0`
      })
    ).pipe(
      map((docs: IPouchDBAllDocsResult) => {
        return docs.rows.map(row => row.doc);
      }),
      concatAll(),
      concatMap((artifact: any) => {
        for (const fileName in artifact._attachments) {
          if (fileName) {
            return this.getAttachment(artifact.id, fileName).pipe(
              map(attachment => {
                artifact._attachments[fileName] = {
                  content_type: attachment.type,
                  data: new File([attachment], fileName)
                };
                return artifact;
              }),
              catchError((err: any) => {
                return of(artifact);
              })
            );
          }
        }
      }),
      reduce((acc: Artifact[], value: Artifact) => {
        acc.push(value);
        return acc;
      }, [])
    );
  }

  update(update: Update<Artifact>): Observable<Artifact> {
    return from(
      this.db
        .get(update.id)
        .then(doc => this.db.put({ ...doc, ...update.changes, _rev: doc._rev }))
    ) as Observable<Artifact>;
  }

  upsert(entity: Artifact): Observable<Artifact> {
    throw new Error('Method not implemented.');
  }

  private getAttachment(docId: string, attachmentId): Observable<Blob> {
    return from(this.db.getAttachment(docId, attachmentId)) as Observable<Blob>;
  }
}
