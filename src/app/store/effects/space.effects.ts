import { Action } from '@ngrx/store';
import { switchMap, map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { DataService } from '../../data.service';
import { Space } from '../../models/space';
import * as spaceActions from '../actions/space.actions';

@Injectable()
export class SpaceEffects {

  @Effect() load$: Observable<Action> = this.actions$.pipe(
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

  @Effect() create$: Observable<Action> = this.actions$.pipe(
    ofType(spaceActions.CREATE),
    switchMap((action: spaceActions.Create) => {
      return this.dataService.createSpace(action.space).pipe(
        map((result: any) => {
          return new spaceActions.CreateSuccess({ ...action.space });
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private dataService: DataService
  ) { }
}
