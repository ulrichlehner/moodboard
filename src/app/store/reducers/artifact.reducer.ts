import { createSelector, createFeatureSelector, ActionReducerMap } from '@ngrx/store';
import { createEntityAdapter, EntityState, EntityAdapter } from '@ngrx/entity';
import { Artifact } from '../../models/artifact';
import * as artifactActions from '../actions/artifact.actions'

export interface ArtifactState extends EntityState<Artifact> {
  activeArtifactId: string | null
}

export const artifactAdapter: EntityAdapter<Artifact> = createEntityAdapter<Artifact>();

export const initialState: ArtifactState = artifactAdapter.getInitialState({
  activeArtifactId: null
});

export const selectArtifactState = createFeatureSelector<ArtifactState>('artifact');

export const { selectAll: selectAllArtifacts, selectEntities } = artifactAdapter.getSelectors(selectArtifactState);

export const selectActiveArtifactId = createSelector(
  selectArtifactState, state => state.activeArtifactId
);

export const selectActiveArtifact = createSelector(
  selectEntities, selectActiveArtifactId, (artifact, id) => artifact[id]
);

export function artifactReducer(state: ArtifactState = initialState, action: artifactActions.ArtifactActions) {
  switch (action.type) {
    case artifactActions.CREATE:
      return artifactAdapter.addOne(action.artifact, state);

    case artifactActions.UPDATE:
      return artifactAdapter.updateOne({
        id: action.id,
        changes: action.changes
      }, state);

    case artifactActions.DELETE:
      let newState: ArtifactState = artifactAdapter.removeOne(action.id, state);
      if (state.activeArtifactId === action.id) {
        newState.activeArtifactId = null;
      }
      return newState;

    case artifactActions.SELECT:
      return { ...state, activeArtifactId: action.id }

    default:
      return state;
  }
}