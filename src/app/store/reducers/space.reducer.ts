import { createSelector, createFeatureSelector, ActionReducerMap } from '@ngrx/store';
import { createEntityAdapter, EntityState, EntityAdapter } from '@ngrx/entity';
import { Space } from '../../models/space';
import * as spaceActions from '../actions/space.actions'

export interface SpaceState extends EntityState<Space> {
  activeSpaceId: string | null
}

export const spaceAdapter: EntityAdapter<Space> = createEntityAdapter<Space>();

export const initialState: SpaceState = spaceAdapter.getInitialState({
  activeSpaceId: null
});

export const selectSpaceState = createFeatureSelector<SpaceState>('space');

export const { selectAll: selectAllSpaces, selectEntities } = spaceAdapter.getSelectors(selectSpaceState);

export const selectActiveSpaceId = createSelector(
  selectSpaceState, state => state.activeSpaceId
);

export const selectActiveSpace = createSelector(
  selectEntities, selectActiveSpaceId, (space, id) => space[id]
);

export function spaceReducer(state: SpaceState = initialState, action: spaceActions.SpaceActions) {
  switch (action.type) {
    case spaceActions.CREATE:
      return spaceAdapter.addOne(action.space, state);

    case spaceActions.UPDATE:
      return spaceAdapter.updateOne({
        id: action.id,
        changes: action.changes
      }, state);

    case spaceActions.DELETE:
      return spaceAdapter.removeOne(action.id, state);

    case spaceActions.SELECT:
      return { ...state, activeSpaceId: action.id }

    default:
      return state;
  }
}