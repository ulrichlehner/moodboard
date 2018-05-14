import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DataService } from '../../data.service';
import * as spaceActions from '../actions/space.actions';

@Injectable()
export class SpaceEffects {
  @Effect()
  load$: Observable<Action> = this.actions$.pipe(
    ofType(spaceActions.LOAD),
    switchMap(() => {
      return this.dataService.getAllSpaces().pipe(
        map(spaces => {
          return new spaceActions.LoadSuccess(spaces);
        }) // ,
        // catchError(error => of(new artifactActions.LoadFail(error)))
      );
    })
  );

  @Effect()
  create$: Observable<Action> = this.actions$.pipe(
    ofType(spaceActions.CREATE),
    switchMap((action: spaceActions.Create) => {
      return this.dataService.createSpace(action.space).pipe(
        map((result: any) => {
          return new spaceActions.CreateSuccess({ ...action.space });
        })
      );
    })
  );

  @Effect()
  update$: Observable<Action> = this.actions$.pipe(
    ofType(spaceActions.UPDATE),
    switchMap((action: spaceActions.Update) => {
      return this.dataService.updateSpace(action.id, action.changes).pipe(
        map((result: any) => {
          return new spaceActions.UpdateSuccess(action.id, {});
        })
      );
    })
  );

  @Effect()
  delete$: Observable<Action> = this.actions$.pipe(
    ofType(spaceActions.DELETE),
    switchMap((action: spaceActions.Delete) => {
      return this.dataService.deleteSpace(action.id).pipe(
        map((result: any) => {
          return new spaceActions.DeleteSuccess();
        })
      );
    })
  );

  constructor(private actions$: Actions, private dataService: DataService) {}
}
