import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss']
})
export class TutorialComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  openTutorialDialog(content) {
    // TODO: implement tutorial dialog
    // this.modalService.open(content, { centered: true, size: 'lg' });
  }
}
