import { ActionReducerMap } from '@ngrx/store';
import * as fromArtifact from './artifact.reducer';
import * as fromSpace from './space.reducer';

export interface State {
  space: fromSpace.SpaceState;
  artifact: fromArtifact.ArtifactState;
}

export const reducers: ActionReducerMap<State> = {
  space: fromSpace.spaceReducer,
  artifact: fromArtifact.artifactReducer
};
