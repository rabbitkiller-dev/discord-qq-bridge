import { Component, Input, OnInit } from '@angular/core';

import { ViewCell } from 'ng2-smart-table';
import { AdminService } from './admin.service';

@Component({
  template: `
    {{renderValue}}
  `,
})
export class SelectRenderComponent implements ViewCell, OnInit {

  renderValue: string;

  @Input() value: string;
  @Input() rowData: any;

  constructor(public adminService: AdminService) {
  }


  ngOnInit() {
    const channel = this.adminService.getChannel(this.value)
    this.renderValue = channel ? channel.name : this.value;
  }

}
