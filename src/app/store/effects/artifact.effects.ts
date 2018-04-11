import { Action } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { ArtifactService } from './../../artifact.service';
import { Artifact } from './../../models/artifact';
import { Injectable } from '@angular/core';
import { Effect, Actions, ofType } from '@ngrx/effects';
import * as artifactActions from '../actions/artifact.actions';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';

@Injectable()
export class ArtifactEffects {

  @Effect() load$: Observable<Action> = this.actions$.pipe(
    ofType(artifactActions.LOAD),
    switchMap(() => {
      return this.db.getAll().pipe(
        map(artifacts => {
          return new artifactActions.LoadSuccess(artifacts);
        }) // ,
        // catchError(error => of(new artifactActions.LoadFail(error)))
      );
    })
  );

  @Effect() create$: Observable<Action> = this.actions$.pipe(
    ofType(artifactActions.CREATE),
    switchMap((action: artifactActions.Create) => {
      return this.db.create(action.artifact).pipe(
        map((result: any) => {
          // console.log(action.artifact);
          return new artifactActions.CreateSuccess({ ...action.artifact, _rev: result.rev });
        })
      );
      // return this.db.create(ac)
    })
  );

  // @Effect({ dispatch: false }) ?
  @Effect() update$: Observable<Action> = this.actions$.pipe(
    ofType(artifactActions.UPDATE),
    switchMap((action: artifactActions.Update) => {
      return this.db.update(action.id, action.changes).pipe(
        map((result: any) => {
          return new artifactActions.UpdateSuccess(action.id, { _rev: result.rev });
        })
      );
    })
  );

  @Effect() delete$: Observable<Action> = this.actions$.pipe(
    ofType(artifactActions.DELETE),
    switchMap((action: artifactActions.Delete) => {
      return this.db.deleteById(action.id).pipe(
        map((result: any) => {
          // return new artifactActions.DeleteSuccess({ ...action.artifact, _rev: result.rev });
          return new artifactActions.DeleteSuccess();
        }, catchError( (err: any) => {
          console.error(`fail`);
          // return null;
          return of(new artifactActions.DeleteFail());
        }))
      );
      // return this.db.create(ac)
    })
  );

  // @Effect() create$: Observable<Action> = this.actions$.pipe(
  //   ofType(artifactActions.CREATE),
  //   // map(),
  //   map((action: artifactActions.Create, index: number) => {
  //     // console.log(index);
  //     // console.log(action);
  //     // return of(new artifactActions.CreateSuccess(action.artifact));

  //     return this.db.create(action.artifact);

  //     // this.db.create(action.artifact).then(response => {
  //     //   console.log("create response:");
  //     //   console.log(response);
  //     // }).catch(err => {
  //     //   console.log("create err:");
  //     //   console.log(err);
  //     // });
  //     // return of(new artifactActions.CreateSuccess(action.artifact));
  //   }),
  //   map((value, index) => {
  //     console.log('value:');
  //     console.log(value);
  //     // return of(new artifactActions.CreateSuccess(null));
  //     return new artifactActions.CreateSuccess(null);
  //   })
  //   // map((action: artifactActions.Create) => action.artifact)
  // );

  // @Effect() delete$: Observable<Action> = this.actions$.pipe(
  //   ofType(artifactActions.DELETE),
  //   mergeMap((action: artifactActions.Delete, index: number) => {
  //     this.db.delete(action.artifact).then(response => {
  //       console.log("delete response:");
  //       console.log(response);
  //       // return of(new artifactActions.DeleteSuccess(action.artifact));
  //     }).catch(err => {
  //       console.log("delete err:");
  //       console.log(err);
  //       // return of(new artifactActions.DeleteSuccess(action.artifact));
  //     });
  //     return of(new artifactActions.DeleteSuccess(action.artifact))
  //   })
  // );

  // @Effect() change$: Observable<any> = this.db.getChanges().pipe(
  //   map(change => {
  //     console.log("change:");
  //     console.log(change);
  // }));

  constructor(
    private actions$: Actions,
    private db: ArtifactService
  ) { }
}
