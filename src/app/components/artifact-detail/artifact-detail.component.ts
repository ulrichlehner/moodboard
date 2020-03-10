import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { ArtifactService } from 'src/app/store/artifact.service';
import { Artifact } from '../../models/artifact';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-artifact-detail',
  templateUrl: './artifact-detail.component.html',
  styleUrls: ['./artifact-detail.component.scss']
})
export class ArtifactDetailComponent implements OnInit {
  @Input() artifact: Artifact;

  constructor(private artifactService: ArtifactService) {}

  ngOnInit() {}

  deleteArtifact(artifact: Artifact) {
    this.artifactService.delete(artifact);
    console.log(`Artifact deleted: ${artifact.name}`);
  }
}
