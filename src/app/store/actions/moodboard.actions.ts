import { createAction, props } from '@ngrx/store';
import { Space } from 'src/app/models/space';

export const activateSpace = createAction(
  '[Moodbard] Activate Space',
  props<{ space: Space | null }>()
);
