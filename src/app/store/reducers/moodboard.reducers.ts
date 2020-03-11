import { createReducer, createSelector, on } from '@ngrx/store';
import { Space } from 'src/app/models/space';
import { activateSpace } from '../actions/moodboard.actions';

export const moodboardFeatureKey = 'moodboard';

export interface AppState {
  [moodboardFeatureKey]: MooodboardState;
}

export interface MooodboardState {
  activeSpace: Space | null;
}

export const initialState: MooodboardState = {
  activeSpace: null
};

// tslint:disable-next-line: variable-name
const _moodboardReducer = createReducer(
  initialState,
  on(activateSpace, (state, action) => ({
    ...state,
    activeSpace: action.space
  }))
);

export function moodboardReducer(state, action) {
  return _moodboardReducer(state, action);
}

export const selectActiveSpace = createSelector(
  (state: AppState) => state[moodboardFeatureKey],
  (state: MooodboardState) => state.activeSpace
);
