import { Component, Input, OnInit } from '@angular/core';

import { ViewCell } from 'ng2-smart-table';
import { AdminService } from './admin.service';

@Component({
  template: `
    {{renderValue}}
  `,
})
export class GuildSelectRenderComponent implements ViewCell, OnInit {

  renderValue: string;

  @Input() value: string;
  @Input() rowData: any;

  constructor(public adminService: AdminService) {
  }


  ngOnInit() {
    const guild = this.adminService.getGuild(this.value)
    this.renderValue = guild ? guild.name : this.value;
  }

}
