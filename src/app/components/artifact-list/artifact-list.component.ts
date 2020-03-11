import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { ArtifactService } from 'src/app/store/artifact.service';
import { Artifact } from '../../models/artifact';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-artifact-list',
  templateUrl: './artifact-list.component.html',
  styleUrls: ['./artifact-list.component.scss']
})
export class ArtifactListComponent implements OnInit {
  artifacts$: Observable<Artifact[]>;

  activeArtifact: Artifact;

  constructor(
    private artifactService: ArtifactService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.artifacts$ = this.artifactService.entities$;

    this.artifactService.getAll();
  }

  selectArtifact(artifact: Artifact) {
    this.activeArtifact = artifact;
  }

  dataUrl(file: File | Blob) {
    return this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
  }
}
