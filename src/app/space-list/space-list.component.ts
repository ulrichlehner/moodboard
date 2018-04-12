import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { SpaceState, selectAllSpaces } from '../store/reducers/space.reducer';
import { Observable } from 'rxjs/Observable';
import { Space } from '../models/space';
import * as spaceActions from '../store/actions/space.actions';
import * as UUID from 'uuidjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-space-list',
  templateUrl: './space-list.component.html',
  styleUrls: ['./space-list.component.css']
})
export class SpaceListComponent implements OnInit {

  spaces$: Observable<Space[]>;

  constructor(private store: Store<SpaceState>) { }

  ngOnInit() {
    this.spaces$ = this.store.select(selectAllSpaces);
    this.store.dispatch(new spaceActions.Load());
  }

  addSpace() {
    const id: string = UUID.generate();
    const space: Space = {
      id: id,
      viewportTransform: [1, 0, 0, 1, 0, 0],
      name: `Space @${id}`,
      createDate: new Date(),
      updateDate: new Date()
    };
    this.store.dispatch(new spaceActions.Create(space));
    console.log(`Space added: ${space.name}`);
  }

}
