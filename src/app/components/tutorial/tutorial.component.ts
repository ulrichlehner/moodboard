import { Component, OnInit, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss']
})
export class TutorialComponent implements OnInit {
  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  onOpenTutorialClick(template: TemplateRef<any>) {
    this.dialog.open(template, {
      maxWidth: 640
    });
  }
}
