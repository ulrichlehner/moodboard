import { map, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Artifact } from './models/artifact';
// import { ARTIFACTS } from './mock-artifacts';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { MessageService } from './message.service';
import PouchDB from 'pouchdb';
import { fromPromise } from 'rxjs/observable/fromPromise';

// see https://www.bennadel.com/blog/3194-experimenting-with-simple-crud-operations-using-pouchdb-in-angular-2-1-1.htm

// CAUTION: There is currently no up-to-date "Definitely Typed" set of interfaces for
// PouchDB. So, in an effort to help me learn about the PouchDB API, I'm providing a few
// tiny interfaces here so I can get a better idea of what data is available.
export interface IPouchDBAllDocsResult {
  offset: number;
  total_rows: number;
  rows: IPouchDBRow[];
}

export interface IPouchDBGetResult {
  _id: string;
  _rev: string;
}

export interface IPouchDBPutResult {
  ok: boolean;
  id: string;
  rev: string;
}

export interface IPouchDBRemoveResult {
  ok: boolean;
  id: string;
  rev: string;
}

export interface IPouchDBRow {
  id: string;
  key: string;
  value: { rev: string };

  // Only included if include_docs is set to true during query.
  doc?: any;
}

export interface IPouchDBGetFriendResult extends IPouchDBGetResult {
  name: string;
}

@Injectable()
export class ArtifactService {

  private db;

  constructor(private messageService: MessageService) {
    this.db = new PouchDB('artifact');
  }

  create(artifact: Artifact): Observable<Artifact> {
    // console.log(`Adding to db: ${artifact.name}`);
    // return this.db.put({ ...artifact, _id: artifact.id });
    return fromPromise(this.db.put({ ...artifact, _id: artifact.id }));
  }

  delete(artifact: Artifact): Observable<Artifact> {
    return fromPromise(this.db.remove({ ...artifact, _id: artifact.id }));
  }

  getAll(): Observable<Artifact[]> {
    // console.log(`Loading all artifacts`);
    return fromPromise(this.db.allDocs({ include_docs: true })).pipe(map( (docs: IPouchDBAllDocsResult) => {
      // console.log(docs);
      return docs.rows.map(row => row.doc);
    }));
  }

  // getChanges(): Observable<any> {
  //   return Observable.create(observer => {
  //     this.db.changes({ live: true, since: 'now', include_docs: true }).on('change', change => {
  //       console.log('change.doc');
  //       console.log(change.doc);
  //       console.log('----------');
  //       observer.next(change.doc);
  //     });
  //   });
  // }

  // getArtifacts(): Observable<Artifact[]> {
  //   // Todo: send the message _after_ fetching the heroes
  //   this.messageService.add('ArtifactService: fetched artifacts');
  //   return of(ARTIFACTS);
  // }

}
