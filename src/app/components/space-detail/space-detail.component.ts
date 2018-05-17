import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Space } from '@models/space';
import { Store } from '@ngrx/store';
import { SpaceState } from '@store/reducers/space.reducer';
import * as spaceActions from '@store/actions/space.actions';

@Component({
  selector: 'app-space-detail',
  templateUrl: './space-detail.component.html',
  styleUrls: ['./space-detail.component.scss']
})
export class SpaceDetailComponent implements OnInit {
  @Input() space: Space;

  spaceForm: FormGroup;

  constructor(private fb: FormBuilder, private store: Store<SpaceState>) {
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

    this.store.dispatch(
      new spaceActions.Update(this.space.id, this.spaceForm.value)
    );
  }
}
