import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { DefaultEditor } from 'ng2-smart-table';
import { AdminService } from './admin.service';

@Component({
  template: `
    <input type="text" nbInput fullWidth placeholder="请输入" [ngModel]="value" (ngModelChange)="onInputValueChange($event)">
  `,
})
export class TableEditorInputComponent extends DefaultEditor implements AfterViewInit, OnInit {
  options: Array<{ title: string, value: string }>
  value: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.value = this.cell.getValue();
  }

  ngAfterViewInit() {
  }

  onInputValueChange($event) {
    this.cell.newValue = $event;
  }

}
