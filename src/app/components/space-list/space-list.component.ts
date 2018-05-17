import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { DataService } from '@app/data.service';
import { Space } from '@models/space';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as spaceActions from '@store/actions/space.actions';
import {
  SpaceState,
  selectActiveSpace,
  selectAllSpaces
} from '@store/reducers/space.reducer';
import { Observable, Subscription } from 'rxjs';

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
  spaceInModel: Space;

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
    const date = new Date();
    const space: Space = {
      id: DataService.generateSpaceId(),
      name: name
        ? name
        : `Inspirespace (${date.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })})`,
      viewportTransform: [1, 0, 0, 1, 0, 0],
      createDate: date,
      updateDate: date
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
    this.spaceInModel = space;
    this.modalService.open(content, { centered: true }).result.then(
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

  openEditDialog(content, space: Space) {
    this.dropdownSpaces.autoClose = false;
    this.spaceInModel = space;
    this.modalService.open(content, { centered: true }).result.then(
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
