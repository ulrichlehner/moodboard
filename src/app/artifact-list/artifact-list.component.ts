import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { ArtifactService } from '../artifact.service';
import { Artifact } from '../models/artifact';
import * as ArtifactActions from '../store/actions/artifact.actions';
import { selectAllArtifacts, selectActiveArtifact, ArtifactState } from '../store/reducers/artifact.reducer';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import * as UUID from 'uuidjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-artifact-list',
  templateUrl: './artifact-list.component.html',
  styleUrls: ['./artifact-list.component.css']
})
export class ArtifactListComponent implements OnInit {

  // artifacts: Artifact[];

  artifacts$: Observable<Artifact[]>;

  // activeArtifact: Artifact;

  activeArtifact$: Observable<Artifact>;

  constructor(private store: Store<ArtifactState>, private artifactService: ArtifactService) { }

  ngOnInit() {
    // this.getArtifacts();
    this.artifacts$ = this.store.select(selectAllArtifacts);
    this.activeArtifact$ = this.store.select(selectActiveArtifact);

    // Dispatch LOAD_ARTIFACTS https://www.youtube.com/watch?v=xkUOQeGqIGI (2:24)
    this.store.dispatch(new ArtifactActions.Load());
  }

  selectArtifact(artifact: Artifact) {
    // this.activeArtifact = artifact;
    this.store.dispatch(new ArtifactActions.Select(artifact.id));
    console.log(`Artifact selected: ${artifact.name}`);
  }

  // getArtifacts(): void {
  //   this.artifactService.getArtifacts().subscribe(artifacts => this.artifacts = artifacts);
  // }

  addArtifact() {
    const id: string = UUID.generate();
    const artifact: Artifact = {
      id: id,
      name: `Artifact @${id}`,
      transform: {
        order: 0,
        x: 0,
        y: 0,
        angle: 0,
        scale: 1.0
      },
      createDate: new Date(),
      updateDate: new Date()
    };
    this.store.dispatch(new ArtifactActions.Create(artifact));
    console.log(`Artifact added: ${artifact.name}`);
  }

}
