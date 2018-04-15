import { Action } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { DataService } from './../../data.service';
import { Artifact } from './../../models/artifact';
import { Injectable } from '@angular/core';
import { Effect, Actions, ofType } from '@ngrx/effects';
import * as artifactActions from '../actions/artifact.actions';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';

@Injectable()
export class ArtifactEffects {
  @Effect()
  load$: Observable<Action> = this.actions$.pipe(
    ofType(artifactActions.LOAD),
    switchMap((action: artifactActions.Load) => {
      return this.dataService.getAllArtifacts(action.spaceId).pipe(
        map(artifacts => {
          return new artifactActions.LoadSuccess(artifacts);
        }) // ,
        // catchError(error => of(new artifactActions.LoadFail(error)))
      );
    })
  );

  @Effect()
  create$: Observable<Action> = this.actions$.pipe(
    ofType(artifactActions.CREATE),
    switchMap((action: artifactActions.Create) => {
      return this.dataService.createArtifact(action.artifact).pipe(
        map((result: any) => {
          // console.log(action.artifact);
          return new artifactActions.CreateSuccess({
            ...action.artifact /*, _rev: result.rev*/
          });
        })
      );
      // return this.db.create(ac)
    })
  );

  // @Effect({ dispatch: false }) ?
  @Effect()
  update$: Observable<Action> = this.actions$.pipe(
    ofType(artifactActions.UPDATE),
    switchMap((action: artifactActions.Update) => {
      return this.dataService.updateArtifact(action.id, action.changes).pipe(
        map((result: any) => {
          return new artifactActions.UpdateSuccess(action.id, {
            /* _rev: result.rev */
          });
        })
      );
    })
  );

  @Effect()
  delete$: Observable<Action> = this.actions$.pipe(
    ofType(artifactActions.DELETE),
    switchMap((action: artifactActions.Delete) => {
      return this.dataService.deleteArtifact(action.id).pipe(
        map(
          (result: any) => {
            // return new artifactActions.DeleteSuccess({ ...action.artifact, _rev: result.rev });
            return new artifactActions.DeleteSuccess();
          },
          catchError((err: any) => {
            console.error(`fail`);
            // return null;
            return of(new artifactActions.DeleteFail());
          })
        )
      );
      // return this.db.create(ac)
    })
  );

  constructor(private actions$: Actions, private dataService: DataService) {}
}
