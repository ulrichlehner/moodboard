import { Artifact } from './../../models/artifact';
import { Action } from '@ngrx/store';

export const CREATE = '[Artifact] Add';
export const UPDATE = '[Artifact] Update';
export const DELETE = '[Artifact] Delete';
export const LOAD = '[Artifact] Load';
export const CREATE_SUCCESS = '[Artifact] Add success';
export const UPDATE_SUCCESS = '[Artifact] Update success';
export const DELETE_SUCCESS = '[Artifact] Delete success';
export const LOAD_SUCCESS = '[Artifact] Load success';
export const CREATE_FAIL = '[Artifact] Add fail';
export const UPDATE_FAIL = '[Artifact] Update fail';
export const DELETE_FAIL = '[Artifact] Delete fail';
export const SELECT = '[Artifact] Select';

export class Create implements Action {
  readonly type = CREATE;

  constructor(public artifact: Artifact) {}
}

export class Update implements Action {
  readonly type = UPDATE;

  constructor(public id: string, public changes: Partial<Artifact>) {}
}

export class Delete implements Action {
  readonly type = DELETE;

  constructor(public id: string) {}
}

export class CreateSuccess implements Action {
  readonly type = CREATE_SUCCESS;

  constructor(public artifact: Artifact) {}
}

export class UpdateSuccess implements Action {
  readonly type = UPDATE_SUCCESS;

  constructor(public id: string, public changes: Partial<Artifact>) {}
}

export class DeleteSuccess implements Action {
  readonly type = DELETE_SUCCESS;

  // constructor(public artifact: Artifact) { }
}

export class DeleteFail implements Action {
  readonly type = DELETE_FAIL;

  // constructor(public artifact: Artifact) { }
}

export class Load implements Action {
  readonly type = LOAD;

  constructor(public spaceId: string = '') {}
}

export class LoadSuccess implements Action {
  readonly type = LOAD_SUCCESS;

  constructor(public artifacts: Artifact[]) {}
}

export class Select implements Action {
  readonly type = SELECT;

  constructor(public readonly id: string) {}
}

export type All =
  | Create
  | CreateSuccess
  | Update
  | UpdateSuccess
  | Delete
  | DeleteSuccess
  | DeleteFail
  | Load
  | LoadSuccess
  | Select;
