import { Injectable } from '@angular/core';
import { EntityCollectionDataService, QueryParams } from '@ngrx/data';
import { Update } from '@ngrx/entity';
import PouchDB from 'pouchdb';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Space } from '../models/space';
import {
  IPouchDBAllDocsResult,
  POUCH_DB_ARTIFACT_ID_PREFIX,
  POUCH_DB_NAME,
  POUCH_DB_SPACE_ID_PREFIX
} from './pouch-db';

@Injectable()
export class SpaceDataService implements EntityCollectionDataService<Space> {
  name = 'Space';

  private db: any;

  constructor() {
    this.db = new PouchDB(POUCH_DB_NAME, { auto_compaction: true });
  }

  add(entity: Space): Observable<Space> {
    return from(this.db.put({ ...entity, _id: entity.id })) as Observable<
      Space
    >;
  }

  delete(id: string | number): Observable<string | number> {
    return from(
      this.db
        .allDocs({
          startkey: `${POUCH_DB_ARTIFACT_ID_PREFIX}:${id}`,
          endkey: `${POUCH_DB_ARTIFACT_ID_PREFIX}:${id}\ufff0`
        })
        .then(allDocs => {
          return allDocs.rows.map(row => {
            return { _id: row.id, _rev: row.value.rev, _deleted: true };
          });
        })
        .then(deleteDocs => {
          return this.db.bulkDocs(deleteDocs);
        })
        .then(() => {
          return this.db.get(id);
        })
        .then(doc => {
          return this.db.remove(id, doc._rev);
        })
        .then(() => {
          return Promise.resolve(id);
        })
    ) as Observable<string | number>;
  }

  getAll(): Observable<Space[]> {
    return from(
      this.db.allDocs({
        include_docs: true,
        startkey: `${POUCH_DB_SPACE_ID_PREFIX}`,
        endkey: `${POUCH_DB_SPACE_ID_PREFIX}\ufff0`
      })
    ).pipe(
      map((docs: IPouchDBAllDocsResult) => {
        return docs.rows
          .sort(
            (a, b) =>
              Date.parse(a.doc.createDate) - Date.parse(b.doc.createDate)
          )
          .map(row => row.doc);
      })
    );
  }

  getById(id: any): Observable<Space> {
    return from(this.db.get(`${POUCH_DB_SPACE_ID_PREFIX}:${id}`)) as Observable<
      Space
    >;
  }

  getWithQuery(params: string | QueryParams): Observable<Space[]> {
    throw new Error('Method not implemented.');
  }

  update(update: Update<Space>): Observable<Space> {
    return from(
      this.db.get(update.id).then(doc => {
        this.db.put({ ...doc, ...update.changes, _rev: doc._rev });
      })
    ) as Observable<Space>;
  }

  upsert(entity: Space): Observable<Space> {
    throw new Error('Method not implemented.');
  }
}
