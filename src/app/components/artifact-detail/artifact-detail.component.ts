import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Artifact } from '@models/artifact';
import { Store } from '@ngrx/store';
import * as ArtifactActions from '@store/actions/artifact.actions';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-artifact-detail',
  templateUrl: './artifact-detail.component.html',
  styleUrls: ['./artifact-detail.component.css']
})
export class ArtifactDetailComponent implements OnInit {
  @Input() artifact: Artifact;
  // artifact$: Observable<Artifact>;

  constructor(private store: Store<any>) {}

  ngOnInit() {
    // this.artifact$ = this.store.select(selectActiveArtifact);
  }

  deleteArtifact(artifact: Artifact) {
    this.store.dispatch(new ArtifactActions.Delete(artifact.id));
    console.log(`Artifact deleted: ${artifact.name}`);
  }
}
