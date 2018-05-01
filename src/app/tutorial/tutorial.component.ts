import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss']
})
export class TutorialComponent implements OnInit {
  constructor(private modalService: NgbModal) {}

  ngOnInit() {}

  openTutoroalDialog(content) {
    this.modalService.open(content, { centered: true, size: 'lg' });
  }
}
