import { map, switchMap, flatMap, catchError, mergeMap, concatMap, concatAll, mergeAll, combineAll, reduce, filter } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Artifact } from './models/artifact';
// import { ARTIFACTS } from './mock-artifacts';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { MessageService } from './message.service';
import PouchDB from 'pouchdb';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { concat } from 'rxjs/operators/concat';
import { Space } from './models/space';

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
export class DataService {

  private db;

  constructor(private messageService: MessageService) {
    this.db = new PouchDB('inspirespac');
  }

  createSpace(space: Space): Observable<Space> {
    return fromPromise(this.db.put({ ...space, _id: `space:${space.id}` }));
  }

  deleteSpaceById(id: string): Observable<any> {
    return fromPromise(this.db.get(`space:${id}`).then(doc => this.db.remove(id, doc._rev)));
  }

  updateSpace(id: string, changes: Partial<Space>): Observable<Space> {
    return fromPromise(this.db.get(`space:${id}`).then(doc => this.db.put({ ...doc, ...changes, _rev: doc._rev })));
  }

  getAllSpaces(): Observable<Space[]> {
    return fromPromise(this.db.allDocs({ include_docs: true, startkey: 'space', endkey: 'space\ufff0' })).pipe(
      map((docs: IPouchDBAllDocsResult) => {
        return docs.rows.map(row => row.doc);
      }));
  }

  getSpace(id: string): Observable<Space> {
    return fromPromise(this.db.get(`space:${id}`));
  }

  createArtifact(artifact: Artifact): Observable<Artifact> {
    return fromPromise(this.db.put({ ...artifact, _id: `artifact:${artifact.id}` }));
  }

  deleteArtifactById(id: string): Observable<any> {
    return fromPromise(this.db.get(`artifact:${id}`).then(doc => this.db.remove(`artifact:${id}`, doc._rev)));
  }

  updateArtifact(id: string, changes: Partial<Artifact>): Observable<Artifact> {
    return fromPromise(this.db.get(`artifact:${id}`).then(doc => this.db.put({ ...doc, ...changes, _rev: doc._rev })));
  }

  getArtifact(id: string): Observable<Artifact> {
    return fromPromise(this.db.get(`artifact:${id}`));
  }

  getAllArtifacts(): Observable<Artifact[]> {
    // see https://codereview.stackexchange.com/questions/152897/switchmap-with-array-of-observables
    return fromPromise(this.db.allDocs({ include_docs: true, startkey: 'artifact', endkey: 'artifact\ufff0' })).pipe(
      map((docs: IPouchDBAllDocsResult) => {
        return docs.rows.map(row => row.doc);
      }),
      concatAll(),
      concatMap((artifact: any) => {
        for (const fileName in artifact._attachments) {
          if (fileName) {
            return this.getAttachment(`artifact:${artifact.id}`, fileName).pipe(map(attachment => {
              artifact._attachments[fileName] = {
                content_type: attachment.type,
                data: new File([attachment], fileName)
              };
              return artifact;
            }), catchError((err: any) => {
              return of(artifact);
            }));
          }
        }
      }),
      reduce((acc: Artifact[], value: Artifact) => {
        acc.push(value);
        return acc;
      }, []));
  }

  getAttachment(docId: string, attachmentId): Observable<Blob> {
    return fromPromise(this.db.getAttachment(docId, attachmentId));
  }


  // deleteById3(id: string): Observable<any> {
  //   // console.log(`deleteById ${id}`);
  //   return fromPromise(this.db.get(id)).pipe(
  //     concat(),
  //     concatMap((doc: any) => {
  //       console.log(`checking for attachments on ${id}`);
  //       if (doc._attachments) {
  //         console.log(`iterating through attachments ${id}`);
  //         for (const attachmentId in doc._attachments) {
  //           if (attachmentId) {
  //             return this.removeAttachment(id, attachmentId, doc._rev).pipe(
  //               switchMap((result: any) => {
  //                 console.log(`attachment removed ${id}`);
  //                 console.log(result);
  //                 // console.log(artifact);
  //                 // return fromPromise(this.db.remove(id, result._rev));
  //                 return fromPromise(this.db.put({ _id: id, _rev: result.rev, _deleted: true }));
  //               }),
  //               catchError((error: any) => {
  //                 console.log('catchError');
  //                 return fromPromise(this.db.remove(id, doc._rev));
  //               })
  //             );
  //           } else {
  //             console.log('else inner');
  //             return fromPromise(this.db.remove(id, doc._rev));
  //           }
  //         }
  //       } else {
  //         console.log('else outer');
  //         return fromPromise(this.db.remove(id, doc._rev));
  //       }
  //     }), catchError((error: any) => {
  //       console.log('catchError');
  //       console.log(error);
  //       return null;
  //     })
  //   );
  // }

  // deleteById2(id: string): Observable<any> {
  //   console.log(`deleteById ${id}`);
  //   return fromPromise(this.db.get(id)).pipe(
  //     switchMap((doc: any) => {
  //       console.log(`checking for attachments on ${id}`);
  //       if (doc._attachments) {
  //         console.log(`iterating through attachments ${id}`);
  //         for (const attachmentId in doc._attachments) {
  //           if (attachmentId) {
  //             return this.removeAttachment(id, attachmentId, doc._rev).pipe(
  //               switchMap((result: any) => {
  //                 console.log(`attachment removed ${id}`);
  //                 console.log(result);
  //                 // console.log(artifact);
  //                 // return fromPromise(this.db.remove(id, result._rev));
  //                 return fromPromise(this.db.put({ _id: id, _rev: result.rev, _deleted: true }));
  //               }),
  //               catchError((error: any) => {
  //                 console.log('catchError');
  //                 return fromPromise(this.db.remove(id, doc._rev));
  //               })
  //             );
  //           } else {
  //             console.log('else inner');
  //             return fromPromise(this.db.remove(id, doc._rev));
  //           }
  //         }
  //       } else {
  //         console.log('else outer');
  //         return fromPromise(this.db.remove(id, doc._rev));
  //       }
  //     }), catchError((error: any) => {
  //       console.log('catchError');
  //       console.log(error);
  //       return null;
  //     })
  //   );
  // }

  // TODO: probably _id: artifact.id is not needed
  // delete(artifact: Artifact): Observable<any> {
  //   for (const fileName in artifact._attachments) {
  //     if (fileName) {
  //       return this.removeAttachment(artifact.id, fileName, artifact._rev).pipe(
  //         switchMap((result: any) => {
  //           console.log(result);
  //           console.log(artifact);
  //           return fromPromise(this.db.remove({ ...artifact, _id: artifact.id, _rev: result._rev }));
  //         }),
  //         catchError((error: any) => {
  //           return fromPromise(this.db.remove({ ...artifact, _id: artifact.id }));
  //         })
  //       );
  //     }
  //   }
  // }

  // removeAttachment(docId: string, attachmentId, rev: string): Observable<IPouchDBRemoveResult> {
  //   return fromPromise(this.db.removeAttachment(docId, attachmentId, rev));
  // }

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

  // getAll(): Observable<Artifact[]> {
  //   return fromPromise(this.db.allDocs({ include_docs: true })).pipe(
  //     map((docs: IPouchDBAllDocsResult) => {
  //       console.log(docs);
  //       return docs.rows.map(row => row.doc);
  //     }),
  //     concatAll(),
  //     mergeMap((artifact: any) => this.db.getAttachment(artifact._id, 'test.jpeg'),
  //       (artifact, attachment: any) => {
  //         artifact._attachments['test.jpeg'] = {
  //           content_type: attachment.type,
  //           // data: attachment
  //           data: new File([attachment], 'test.jpeg')
  //         };
  //         return artifact;
  //       }), catchError((err: any) => {
  //         // console.log(`no attachment`);
  //         return [];
  //       }),
  //       reduce( (acc: Artifact[], value: Artifact) => {
  //         // console.log('---');
  //         // console.log(acc);
  //         // console.log(value);
  //         acc.push(value);
  //         return acc;
  //       }, []));
  // }

}
