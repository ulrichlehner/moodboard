import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { DataService } from '../data.service';
import { Space } from '../models/space';
import * as spaceActions from '../store/actions/space.actions';
import {
  SpaceState,
  selectActiveSpace,
  selectAllSpaces
} from '../store/reducers/space.reducer';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

export enum Appearance {
  Light = 'light',
  Dark = 'dark'
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-space-list',
  templateUrl: './space-list.component.html',
  styleUrls: ['./space-list.component.css']
})
export class SpaceListComponent implements OnInit {
  // Workaround to make enum accessible in template
  // see https://stackoverflow.com/questions/37277527/how-to-use-enum-in-angular-2-templates#37277643
  Appearance = Appearance;
  @Input() appearance: Appearance = Appearance.Dark;
  @ViewChild('dropdownSpaces') dropdownSpaces: NgbDropdown;

  spaces$: Observable<Space[]>;
  activeSpace$: Observable<Space>;

  constructor(private store: Store<SpaceState>) {}

  ngOnInit() {
    this.spaces$ = this.store.select(selectAllSpaces);
    this.activeSpace$ = this.store.select(selectActiveSpace);
    this.store.dispatch(new spaceActions.Load());
  }

  activateSpace(space: Space) {
    this.store.dispatch(new spaceActions.Activate(space.id));
    this.dropdownSpaces.close();
  }

  addSpace() {
    const id: string = DataService.generateSpaceId();
    const space: Space = {
      id: id,
      viewportTransform: [1, 0, 0, 1, 0, 0],
      name: `Space @${id}`,
      createDate: new Date(),
      updateDate: new Date()
    };
    this.store.dispatch(new spaceActions.Create(space));
  }

  deleteSpace(space: Space) {
    this.store.dispatch(new spaceActions.Delete(space.id));
  }
}
