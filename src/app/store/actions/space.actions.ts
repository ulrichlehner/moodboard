import { Action } from '@ngrx/store';
import { Space } from '../../models/space';

export const CREATE = '[Space] Add';
export const UPDATE = '[Space] Update';
export const DELETE = '[Space] Delete';
export const LOAD = '[Space] Load';
export const CREATE_SUCCESS = '[Space] Add success';
export const UPDATE_SUCCESS = '[Space] Update success';
export const DELETE_SUCCESS = '[Space] Delete success';
export const LOAD_SUCCESS = '[Space] Load success';
export const CREATE_FAIL = '[Space] Add fail';
export const UPDATE_FAIL = '[Space] Update fail';
export const DELETE_FAIL = '[Space] Delete fail';
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

export class CreateSuccess implements Action {
  readonly type = CREATE_SUCCESS;

  constructor(public space: Space) { }
}

export class UpdateSuccess implements Action {
  readonly type = UPDATE_SUCCESS;

  constructor(public id: string, public changes: Partial<Space>) { }
}

export class DeleteSuccess implements Action {
  readonly type = DELETE_SUCCESS;
}

export class DeleteFail implements Action {
  readonly type = DELETE_FAIL;
}

export class Load implements Action {
  readonly type = LOAD;
}

export class LoadSuccess implements Action {
  readonly type = LOAD_SUCCESS;

  constructor(public spaces: Space[]) { }
}

export class Select implements Action {
  readonly type = SELECT;

  constructor(public readonly id: string) { }
}

export type All = Create | CreateSuccess | Update | UpdateSuccess | Delete | DeleteSuccess | DeleteFail | Load | LoadSuccess | Select;
