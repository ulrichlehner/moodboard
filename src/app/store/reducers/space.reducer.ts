import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Space } from '../../models/space';
import * as spaceActions from '../actions/space.actions';

export interface SpaceState extends EntityState<Space> {
  activeSpaceId: string | null;
}

export const spaceAdapter: EntityAdapter<Space> = createEntityAdapter<Space>();

export const initialState: SpaceState = spaceAdapter.getInitialState({
  activeSpaceId: null
});

export const selectSpaceState = createFeatureSelector<SpaceState>('space');

export const {
  selectAll: selectAllSpaces,
  selectEntities
} = spaceAdapter.getSelectors(selectSpaceState);

export const selectActiveSpaceId = createSelector(
  selectSpaceState,
  state => state.activeSpaceId
);

export const selectActiveSpace = createSelector(
  selectEntities,
  selectActiveSpaceId,
  (space, id) => space[id]
);

export function spaceReducer(
  state: SpaceState = initialState,
  action: spaceActions.All
) {
  switch (action.type) {
    case spaceActions.LOAD:
      return { ...state };

    case spaceActions.LOAD_SUCCESS:
      const loadSuccessState: SpaceState = spaceAdapter.addAll(
        action.spaces,
        state
      );
      if (loadSuccessState.ids.length > 0) {
        loadSuccessState.activeSpaceId = loadSuccessState.ids[0].toString();
      }
      return loadSuccessState;

    case spaceActions.CREATE:
      return spaceAdapter.addOne(action.space, state);

    case spaceActions.UPDATE:
      return spaceAdapter.updateOne(
        {
          id: action.id,
          changes: { ...action.changes }
        },
        state
      );

    case spaceActions.DELETE:
      const deleteState: SpaceState = spaceAdapter.removeOne(action.id, state);
      if (state.activeSpaceId === action.id) {
        // Select latest space
        deleteState.activeSpaceId =
          state.ids.length > 0
            ? state.ids[
                state.ids.length > 1
                  ? action.id === state.ids[state.ids.length - 1]
                    ? state.ids.length - 2
                    : state.ids.length - 1
                  : 0
              ].toString()
            : null;
      }
      return deleteState;

    case spaceActions.ACTIVATE:
      return { ...state, activeSpaceId: action.id };

    default:
      return state;
  }
}
