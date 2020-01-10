import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  openInfoDialog(content) {
    // TODO: open modal dialog
    // this.modalService.open(content, { centered: true, size: 'lg' });
  }
}
