import { ActionReducerMap } from '@ngrx/store';
import * as fromArtifact from './artifact.reducer';

export interface State {
  artifact: fromArtifact.ArtifactState;
}

export const reducers: ActionReducerMap<State> = {
  artifact: fromArtifact.artifactReducer
};
