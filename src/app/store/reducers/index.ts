import { createSelector, createFeatureSelector, ActionReducerMap } from '@ngrx/store';
import * as fromSpace from './space.reducer';
import * as fromArtifact from './artifact.reducer';

export interface State {
  space: fromSpace.SpaceState;
  artifact: fromArtifact.ArtifactState;
}

export const reducers: ActionReducerMap<State> = {
  space: fromSpace.spaceReducer,
  artifact: fromArtifact.artifactReducer
};
