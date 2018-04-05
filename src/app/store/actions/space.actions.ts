import { Action } from '@ngrx/store';
import { Space } from '../../models/space';

export const CREATE = '[Space] Add';
export const UPDATE = '[Space] Update';
export const DELETE = '[Space] Delete';
export const SELECT = '[Space] Select';

export class Create implements Action {
  readonly type = CREATE;

  constructor(public space: Space) { }
}

export class Update implements Action {
  readonly type = UPDATE;

  constructor(public id: string, public changes: Partial<Space>) { }
}

export class Delete implements Action {
  readonly type = DELETE;

  constructor(public id: string) { }
}

export class Select implements Action {
  readonly type = SELECT;

  constructor(public readonly id: string) { }
}

export type SpaceActions = Create |  Update | Delete | Select;
