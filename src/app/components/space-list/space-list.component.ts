import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { activateSpace } from 'src/app/store/actions/moodboard.actions';
import {
  AppState,
  selectActiveSpace
} from 'src/app/store/reducers/moodboard.reducers';
import { SpaceService } from 'src/app/store/space.service';
import { LayoutService } from '../../layout/layout.service';
import { Space } from '../../models/space';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-space-list',
  templateUrl: './space-list.component.html',
  styleUrls: ['./space-list.component.scss']
})
export class SpaceListComponent implements OnInit, OnDestroy {
  spaces$: Observable<Space[]>;

  /**
   * The active space on the canvas
   */
  activeSpace$: Observable<Space | null>;

  /**
   * The space that is edited / deleted by a user
   */
  currentSpace: Space;

  private activeSpace: Space | null = null;
  private activeSpaceSubscription: Subscription;

  private spaces: Space[] = [];
  private spacesSubscription: Subscription;

  constructor(
    public layout: LayoutService,
    private store: Store<AppState>,
    private dialog: MatDialog,
    private spaceService: SpaceService
  ) {}

  ngOnInit() {
    this.spaces$ = this.spaceService.entities$;
    this.activeSpace$ = this.store.pipe(select(selectActiveSpace));
    this.activeSpaceSubscription = this.activeSpace$.subscribe(
      activeSpace => (this.activeSpace = activeSpace)
    );
    this.spacesSubscription = this.spaces$.subscribe(
      spaces => (this.spaces = spaces)
    );
  }

  ngOnDestroy() {
    this.activeSpaceSubscription.unsubscribe();
    this.spacesSubscription.unsubscribe();
  }

  onSpaceSelectionChange(space: Space) {
    this.store.dispatch(activateSpace({ space }));
  }

  async onCreateSpaceClick(name?: string) {
    const date = new Date();
    const space: Space = {
      id: SpaceService.generateId(),
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
    this.store.dispatch(
      activateSpace({
        space: await this.spaceService
          .add(space)
          .pipe(take(1))
          .toPromise()
      })
    );
  }

  onDeleteSpaceClick(space: Space) {
    this.spaceService.delete(space);
    if (space.id === this.activeSpace?.id) {
      this.store.dispatch(
        activateSpace({ space: this.spaces.length > 0 ? this.spaces[0] : null })
      );
    }
  }

  onOpenDialogClick(template: TemplateRef<any>, space: Space) {
    this.currentSpace = space;
    this.dialog.open(template);
  }

  trackBySpace(index: number, space: Space) {
    return space.id;
  }
}
