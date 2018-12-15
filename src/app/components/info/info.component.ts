import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {
  constructor(private modalService: NgbModal) {}

  ngOnInit() {}

  openInfoDialog(content) {
    this.modalService.open(content, { centered: true, size: 'lg' });
  }
}
