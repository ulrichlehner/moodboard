import {
  createSelector,
  createFeatureSelector,
  ActionReducerMap
} from '@ngrx/store';
import { createEntityAdapter, EntityState, EntityAdapter } from '@ngrx/entity';
import { Artifact } from '../../models/artifact';
import * as artifactActions from '../actions/artifact.actions';

export interface ArtifactState extends EntityState<Artifact> {
  // activeArtifactId: string | null;
}

export const artifactAdapter: EntityAdapter<Artifact> = createEntityAdapter<
  Artifact
>();

export const initialState: ArtifactState = artifactAdapter.getInitialState({
  // activeArtifactId: null
});

export const selectArtifactState = createFeatureSelector<ArtifactState>(
  'artifact'
);

export const {
  selectAll: selectAllArtifacts,
  selectEntities
} = artifactAdapter.getSelectors(selectArtifactState);

// export const selectActiveArtifactId = createSelector(
//   selectArtifactState,
//   state => state.activeArtifactId
// );

// export const selectActiveArtifact = createSelector(
//   selectEntities,
//   selectActiveArtifactId,
//   (artifact, id) => artifact[id]
// );

export function artifactReducer(
  state: ArtifactState = initialState,
  action: artifactActions.All
) {
  switch (action.type) {
    case artifactActions.LOAD:
      return { ...initialState };

    case artifactActions.LOAD_SUCCESS:
      return artifactAdapter.addAll(action.artifacts, state);

    case artifactActions.CREATE:
      return artifactAdapter.addOne(action.artifact, state);

    case artifactActions.CREATE_SUCCESS:
      return artifactAdapter.updateOne(
        {
          id: action.artifact.id,
          changes: action.artifact
        },
        state
      );

    case artifactActions.UPDATE:
      return artifactAdapter.updateOne(
        {
          id: action.id,
          changes: { ...action.changes, updateDate: new Date() }
        },
        state
      );

    case artifactActions.UPDATE_SUCCESS:
      return artifactAdapter.updateOne(
        {
          id: action.id,
          changes: action.changes
        },
        state
      );

    case artifactActions.DELETE:
      return artifactAdapter.removeOne(action.id, state);

    // case artifactActions.SELECT:
    //   return { ...state, activeArtifactId: action.id };

    default:
      return state;
  }
}
