import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { from as fromPromise, Observable, of } from 'rxjs';
import { catchError, concatAll, concatMap, map, reduce } from 'rxjs/operators';
import * as UUID from 'uuidjs';
import { MessageService } from './message.service';
import { Artifact } from './models/artifact';
import {
  IPouchDBAllDocsResult,
  POUCH_DB_ARTIFACT_ID_PREFIX,
  POUCH_DB_NAME,
  POUCH_DB_SPACE_ID_PREFIX
} from './store/pouch-db';

@Injectable()
export class DataService {
  private db: any;

  public static generateArtifactId(spaceId: string): string {
    return `${POUCH_DB_ARTIFACT_ID_PREFIX}:${spaceId}:${UUID.generate()}`;
  }

  public static generateSpaceId(): string {
    return `${POUCH_DB_SPACE_ID_PREFIX}:${UUID.generate()}`;
  }

  constructor(private messageService: MessageService) {
    this.db = new PouchDB(POUCH_DB_NAME, { auto_compaction: true });
  }

  //#region Artifact
  createArtifact(artifact: Artifact): Observable<Artifact> {
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
        startkey: `${POUCH_DB_ARTIFACT_ID_PREFIX}:${spaceId}`,
        endkey: `${POUCH_DB_ARTIFACT_ID_PREFIX}:${spaceId}\ufff0`
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
