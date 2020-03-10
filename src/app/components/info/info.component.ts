import { Component, OnInit, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {
  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  onOpenInfoClick(template: TemplateRef<any>) {
    this.dialog.open(template);
  }
}
