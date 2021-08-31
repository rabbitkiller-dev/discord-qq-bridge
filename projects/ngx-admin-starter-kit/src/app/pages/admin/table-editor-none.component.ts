import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { DefaultEditor } from 'ng2-smart-table';
import { AdminService } from './admin.service';

@Component({
  template: ``,
})
export class TableEditorNoneComponent extends DefaultEditor implements AfterViewInit {
  constructor() {
    super();
  }

  ngAfterViewInit() {
  }

  onSelectedChange($event) {
  }

}
