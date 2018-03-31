import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

import * as ArtifactActions from '../store/actions/artifact.actions';

import { Artifact } from '../models/artifact';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { selectActiveArtifact } from '../store/reducers/artifact.reducer';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-artifact-detail',
  templateUrl: './artifact-detail.component.html',
  styleUrls: ['./artifact-detail.component.css']
})
export class ArtifactDetailComponent implements OnInit {

  // @Input() artifact: Artifact;
  artifact$: Observable<Artifact>;

  constructor(private store: Store<any>) { }

  ngOnInit() {
    this.artifact$ = this.store.select(selectActiveArtifact);
  }

  deleteArtifact(artifact: Artifact) {
    this.store.dispatch(new ArtifactActions.Delete(artifact));
    console.log(`Artifact deleted: ${artifact.name}`);
  }

}
