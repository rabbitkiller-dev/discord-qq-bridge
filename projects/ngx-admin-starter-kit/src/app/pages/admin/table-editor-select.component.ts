import { Component, AfterViewInit, OnInit } from '@angular/core';
import { DefaultEditor } from 'ng2-smart-table';

@Component({
  template: `
    <nb-select selected="1" style="width: 100%" (selectedChange)="onSelectedChange($event)">
<!--      <nb-option-group [title]="'asdasd'">-->
<!--        <nb-option [value]="option.value" *ngFor="let option of options">{{option.label}}</nb-option>-->
<!--      </nb-option-group>-->
<!--      <ng-template *ngFor="let option of options">-->
<!--        <ng-container *ngIf="option.children && option.children.length > 0 else item">-->
          <nb-option-group [title]="option.label" *ngFor="let option of options">
            <nb-option [value]="item.value" *ngFor="let item of option.children">{{item.label}}</nb-option>
          </nb-option-group>
<!--        </ng-container>-->
<!--        <ng-template #item>-->
<!--          <nb-option [value]="option.value" *ngFor="let option of options">{{option.label}}</nb-option>-->
<!--        </ng-template>-->

<!--      </ng-template>-->
    </nb-select>
  `,
})
export class TableEditorSelectComponent extends DefaultEditor implements AfterViewInit, OnInit {
  options: Array<{ label: string, value: string, children?: Array<{label: string, value: string}> }>

  constructor() {
    super();
  }

  ngOnInit() {
    this.options = this.cell.getColumn().editor.config.list;
    console.log(this.options);
  }

  ngAfterViewInit() {
  }

  onSelectedChange($event) {
    this.cell.newValue = $event;
  }

}
