import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { Observable, from as fromPromise, of } from 'rxjs';
import { catchError, concatAll, concatMap, map, reduce } from 'rxjs/operators';
import * as UUID from 'uuidjs';
import { MessageService } from './message.service';
import { Artifact } from './models/artifact';
import { Space } from './models/space';
import * as mobilenet from '@tensorflow-models/mobilenet';

//#region PouchDB interfaces
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
//#endregion

@Injectable()
export class DataService {
  static SPACE_ID_PREFIX = 'space';
  static ARTIFACT_ID_PREFIX = 'artifact';
  readonly DB_NAME = 'inspirespace';

  private db: any;

  public static generateArtifactId(spaceId: string): string {
    return `${this.ARTIFACT_ID_PREFIX}:${spaceId}:${UUID.generate()}`;
  }

  public static generateSpaceId(): string {
    return `${this.SPACE_ID_PREFIX}:${UUID.generate()}`;
  }

  constructor(private messageService: MessageService) {
    this.db = new PouchDB(this.DB_NAME, { auto_compaction: true });
  }

  //#region Space
  createSpace(space: Space): Observable<Space> {
    return fromPromise(this.db.put({ ...space, _id: space.id })) as Observable<
      Space
    >;
  }

  deleteSpace(spaceId: string): Observable<any> {
    return fromPromise(
      this.db
        .allDocs({
          startkey: `${DataService.ARTIFACT_ID_PREFIX}:${spaceId}`,
          endkey: `${DataService.ARTIFACT_ID_PREFIX}:${spaceId}\ufff0`
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
          return this.db.get(spaceId);
        })
        .then(doc => {
          this.db.remove(spaceId, doc._rev);
        })
    );
  }

  updateSpace(spaceId: string, changes: Partial<Space>): Observable<Space> {
    return fromPromise(
      this.db.get(spaceId).then(doc => {
        this.db.put({ ...doc, ...changes, _rev: doc._rev });
      })
    ) as Observable<Space>;
  }

  getAllSpaces(): Observable<Space[]> {
    return fromPromise(
      this.db.allDocs({
        include_docs: true,
        startkey: `${DataService.SPACE_ID_PREFIX}`,
        endkey: `${DataService.SPACE_ID_PREFIX}\ufff0`
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

  getSpace(id: string): Observable<Space> {
    return fromPromise(this.db.get(`space:${id}`)) as Observable<Space>;
  }
  //#endregion

  //#region Artifact
  createArtifact(artifact: Artifact): Observable<Artifact> {
    console.log('1', artifact._attachments);
    console.log(mobilenet);
    mobilenet
      .load({
        version: 2,
        alpha: 1
      })
      .then(async model => {
        console.log('2', model);
        const attachments = artifact._attachments
          ? Object.values(artifact._attachments)
          : undefined;
        if (attachments && attachments.length > 0) {
          console.log('3', attachments[0].data);
          const reader = new FileReader();
          reader.onload = () => {
            //  document.getElementById("image1").src=base64data;
            const img = new Image();
            const canvas = document.createElement('canvas');

            const ctx = canvas.getContext('2d');
            img.onload = () => {
              ctx.drawImage(img, 0, 0);

              const features = model.infer(img);
              console.log('features', features);
              console.log(model.classify(img));
            };
            img.src = reader.result as string;
          };
          reader.readAsDataURL(attachments[0].data);
        }
      })
      .catch(error => {
        console.error('ohoh', error);
      });
    return fromPromise(
      this.db.put({
        ...artifact,
        _id: artifact.id
      }) as Observable<Artifact>
    );
  }

  deleteArtifact(artifactId: string): Observable<any> {
    return fromPromise(
      this.db.get(artifactId).then(doc => this.db.remove(artifactId, doc._rev))
    );
  }

  updateArtifact(
    artifactId: string,
    changes: Partial<Artifact>
  ): Observable<Artifact> {
    return fromPromise(
      this.db
        .get(artifactId)
        .then(doc => this.db.put({ ...doc, ...changes, _rev: doc._rev }))
    ) as Observable<Artifact>;
  }

  getArtifact(artifactId: string): Observable<Artifact> {
    return fromPromise(this.db.get(artifactId)) as Observable<Artifact>;
  }

  getAllArtifacts(spaceId: string): Observable<Artifact[]> {
    // see https://codereview.stackexchange.com/questions/152897/switchmap-with-array-of-observables
    return fromPromise(
      this.db.allDocs({
        include_docs: true,
        startkey: `${DataService.ARTIFACT_ID_PREFIX}:${spaceId}`,
        endkey: `${DataService.ARTIFACT_ID_PREFIX}:${spaceId}\ufff0`
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
  //#endregion

  //#region Generic
  getAttachment(docId: string, attachmentId): Observable<Blob> {
    return fromPromise(
      this.db.getAttachment(docId, attachmentId)
    ) as Observable<Blob>;
  }
  //#endregion
}
