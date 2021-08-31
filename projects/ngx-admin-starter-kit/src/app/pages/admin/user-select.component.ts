import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { DefaultEditor } from 'ng2-smart-table';
import { AdminService } from './admin.service';

@Component({
  template: `
    <nb-select selected="1" style="width: 100%" (selectedChange)="onSelectedChange($event)">
      <nb-option [value]="option.value" *ngFor="let option of options">{{option.title}}</nb-option>
    </nb-select>
  `,
})
export class TableSelectComponent extends DefaultEditor implements AfterViewInit, OnInit {
  options: Array<{ title: string, value: string }>

  constructor() {
    super();
  }

  ngOnInit() {
    this.options = this.cell.getColumn().editor.config.list;
  }

  ngAfterViewInit() {
  }

  onSelectedChange($event) {
    this.cell.newValue = $event;
  }

}
