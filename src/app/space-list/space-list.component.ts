import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
import { timer } from 'rxjs/observable/timer';
import { Subscription } from 'rxjs/Subscription';

export enum Appearance {
  Light = 'light',
  Dark = 'dark'
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-space-list',
  templateUrl: './space-list.component.html',
  styleUrls: ['./space-list.component.scss']
})
export class SpaceListComponent implements OnInit, OnDestroy {
  // Workaround to make enum accessible in template
  // see https://stackoverflow.com/questions/37277527/how-to-use-enum-in-angular-2-templates#37277643
  Appearance = Appearance;
  @Input() appearance: Appearance = Appearance.Dark;
  @ViewChild('dropdownSpaces') dropdownSpaces: NgbDropdown;

  spaces$: Observable<Space[]>;
  activeSpace$: Observable<Space>;
  spaceToBeDeleted: Space;

  spacesSubcription: Subscription;
  spaces: Space[];

  constructor(
    private store: Store<SpaceState>,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.spaces$ = this.store.select(selectAllSpaces);
    this.activeSpace$ = this.store.select(selectActiveSpace);
    this.store.dispatch(new spaceActions.Load());

    this.spacesSubcription = this.spaces$.subscribe(
      (spaces: Space[]) => (this.spaces = spaces)
    );
  }

  ngOnDestroy() {
    this.spacesSubcription.unsubscribe();
  }

  activateSpace(space: Space) {
    this.store.dispatch(new spaceActions.Activate(space.id));
    this.dropdownSpaces.close();
  }

  addSpace(name?: string) {
    const space: Space = {
      id: DataService.generateSpaceId(),
      name: name
        ? name
        : `Inspirespace${
            this.spaces.length > 0 ? ' ' + (this.spaces.length + 1) : ''
          }`,
      viewportTransform: [1, 0, 0, 1, 0, 0],
      createDate: new Date(),
      updateDate: new Date()
    };
    this.store.dispatch(new spaceActions.Create(space));

    if (this.dropdownSpaces) {
      // Close dropdown with small delay so a user sees that new item has been created
      // timer(300).subscribe(done => {
      // console.log('should close');
      this.dropdownSpaces.close(); // Doesn't work??
      // });
    }
  }

  deleteSpace(space: Space) {
    this.store.dispatch(new spaceActions.Delete(space.id));
  }

  openDeleteConfirmationDialog(content, space: Space) {
    this.dropdownSpaces.autoClose = false;
    this.spaceToBeDeleted = space;
    this.modalService.open(content).result.then(
      result => {
        this.dropdownSpaces.autoClose = 'outside';
        // console.log('closed');
      },
      reason => {
        this.dropdownSpaces.autoClose = 'outside';
        // console.log('dismissed');
      }
    );
  }
}
