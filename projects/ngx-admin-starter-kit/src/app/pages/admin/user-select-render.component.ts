import { Component, Input, OnInit } from '@angular/core';

import { ViewCell } from 'ng2-smart-table';
import { AdminService } from './admin.service';

@Component({
  template: `
    {{renderValue}}
  `,
})
export class UserSelectRenderComponent implements ViewCell, OnInit {

  renderValue: string;

  @Input() value: string;
  @Input() rowData: any;

  constructor(public adminService: AdminService) {
  }


  ngOnInit() {
    const user = this.adminService.getUser(this.value)
    this.renderValue =`${user.username}#${user.discriminator}${user.bot ? '[机器人]' : ''}`;
  }

}
