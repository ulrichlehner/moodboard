import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { SpaceState, selectAllSpaces } from '../store/reducers/space.reducer';
import { Observable } from 'rxjs/Observable';
import { Space } from '../models/space';
import * as SpaceActions from '../store/actions/space.actions';

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
  }

  addSpace() {
    let id: string = new Date().getUTCMilliseconds().toString();
    const space: Space = {
      id: id,
      name: `Space @${id}`,
      createDate: new Date(),
      updateDate: new Date()
    };
    this.store.dispatch(new SpaceActions.Create(space));
    console.log(`Space added: ${space.name}`);
  }

}
