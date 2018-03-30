import { Injectable } from '@angular/core';

import { Artifact } from './models/artifact';
import { ARTIFACTS } from './mock-artifacts';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

import { MessageService } from './message.service';

@Injectable()
export class ArtifactService {

  constructor(private messageService: MessageService) { }

  getArtifacts(): Observable<Artifact[]> {
    // Todo: send the message _after_ fetching the heroes
    this.messageService.add('ArtifactService: fetched artifacts');
    return of(ARTIFACTS);
  }

}
