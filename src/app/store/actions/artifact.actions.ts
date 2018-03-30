import { Action } from '@ngrx/store';
import { Artifact } from '../../models/artifact';

export const CREATE = '[Artifact] Add';
export const UPDATE = '[Artifact] Update';
export const DELETE = '[Artifact] Delete';
export const SELECT = '[Artifact] Select';

export class Create implements Action {
  readonly type = CREATE;

  constructor(public artifact: Artifact) { }
}

export class Update implements Action {
  readonly type = UPDATE;

  constructor(public id: string, public changes: Partial<Artifact>) { }
}

export class Delete implements Action {
  readonly type = DELETE;

  constructor(public id: string) { }
}

export class Select implements Action {
  readonly type = SELECT;

  constructor(public readonly id: string) { }
}

export type ArtifactActions = Create |  Update | Delete | Select;