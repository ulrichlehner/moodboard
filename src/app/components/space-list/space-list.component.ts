import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { DataService } from '../../data.service';
import { LayoutService } from '../../layout/layout.service';
import { Space } from '../../models/space';
import * as spaceActions from '../../store/actions/space.actions';
import {
  selectActiveSpace,
  selectAllSpaces,
  SpaceState
} from '../../store/reducers/space.reducer';

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

  spaces$: Observable<Space[]>;

  /**
   * The active space on the canvas
   */
  activeSpace$: Observable<Space>;

  /**
   * The space that is edited / deleted by a user
   */
  currentSpace: Space;

  spacesSubcription: Subscription;
  spaces: Space[];

  constructor(
    public layout: LayoutService,
    private store: Store<SpaceState>,
    private dialog: MatDialog
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

  onActivateSpaceClick(space: Space) {
    this.store.dispatch(new spaceActions.Activate(space.id));
    // this.dropdownSpaces.close();
  }

  onCreateSpaceClick(name?: string) {
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
  }

  onDeleteSpaceClick(space: Space) {
    this.store.dispatch(new spaceActions.Delete(space.id));
  }

  onOpenDialogClick(template: TemplateRef<any>, space: Space) {
    this.currentSpace = space;
    this.dialog.open(template);
  }
}
