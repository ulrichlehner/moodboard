import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SpaceService } from 'src/app/store/space.service';
import { Space } from '../../models/space';

@Component({
  selector: 'app-space-detail',
  templateUrl: './space-detail.component.html',
  styleUrls: ['./space-detail.component.scss']
})
export class SpaceDetailComponent implements OnInit {
  @Input() space: Space;

  spaceForm: FormGroup;

  constructor(private fb: FormBuilder, private spaceService: SpaceService) {
    this.createForm();
  }

  ngOnInit() {
    this.spaceForm.patchValue(this.space);
  }

  createForm() {
    this.spaceForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  saveSpace() {
    if (this.spaceForm.status !== 'VALID') {
      console.warn('Tried to save invalid space');
      return;
    }
    this.spaceService.update({ id: this.space.id, ...this.spaceForm.value });
  }
}
