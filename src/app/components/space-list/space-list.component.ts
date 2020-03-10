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

  async ngOnInit() {
    this.spaces$ = this.spaceService.entities$;
    this.activeSpace$ = this.store.pipe(select(selectActiveSpace));
    this.activeSpaceSubscription = this.activeSpace$.subscribe(
      activeSpace => (this.activeSpace = activeSpace)
    );
    this.spacesSubscription = this.spaces$.subscribe(
      spaces => (this.spaces = spaces)
    );

    try {
      const [spaces] = await Promise.all([
        this.spaceService
          .getAll()
          .pipe(take(1))
          .toPromise(),
        this.spaceService.loaded$.pipe(take(1)).toPromise()
      ]);
      if (spaces.length > 0) {
        this.store.dispatch(activateSpace({ space: spaces[0] }));
      }
    } catch (e) {
      console.error('Error loading spaces', e);
    }
  }

  ngOnDestroy() {
    this.activeSpaceSubscription.unsubscribe();
    this.spacesSubscription.unsubscribe();
  }

  onSpaceSelectionChange(space: Space) {
    this.store.dispatch(activateSpace({ space }));
  }

  onCreateSpaceClick(name?: string) {
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
    this.spaceService.add(space);
  }

  onDeleteSpaceClick(space: Space) {
    this.spaceService.delete(space);
    console.warn('setting active spaces where it should be done via an effect');
    if (space.id === this.activeSpace?.id) {
      this.store.dispatch(
        activateSpace(this.spaces.length > 0 ? { space: this.spaces[0] } : null)
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
