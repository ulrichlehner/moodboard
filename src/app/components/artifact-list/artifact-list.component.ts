import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { DataService } from '@app/data.service';
import { Artifact } from '@models/artifact';
import * as artifactActions from '@store/actions/artifact.actions';
import {
  ArtifactState,
  // selectActiveArtifact,
  selectAllArtifacts
} from '@store/reducers/artifact.reducer';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-artifact-list',
  templateUrl: './artifact-list.component.html',
  styleUrls: ['./artifact-list.component.css']
})
export class ArtifactListComponent implements OnInit {
  // artifacts: Artifact[];

  artifacts$: Observable<Artifact[]>;

  activeArtifact: Artifact;

  // activeArtifact$: Observable<Artifact>;

  constructor(
    private store: Store<ArtifactState>,
    private dataService: DataService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // this.getArtifacts();
    this.artifacts$ = this.store.select(selectAllArtifacts);
    // this.activeArtifact$ = this.store.select(selectActiveArtifact);

    // Dispatch LOAD_ARTIFACTS https://www.youtube.com/watch?v=xkUOQeGqIGI (2:24)
    this.store.dispatch(new artifactActions.Load());
  }

  selectArtifact(artifact: Artifact) {
    this.activeArtifact = artifact;
    // this.store.dispatch(new artifactActions.Select(artifact.id));
    // console.log(`Artifact selected: ${artifact.name}`);
  }

  dataUrl(file: File) {
    return this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
  }
}
