import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbToggleModule,
} from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { ThemeModule } from '../../@theme/theme.module';
import { AdminComponent } from './admin.component';
import { ConfigComponent } from './config.component';
import {BridgeConfigComponent} from './bridge-config.component';
import { SelectRenderComponent } from './select-render.component';
import { UserSelectRenderComponent } from './user-select-render.component';
import { TableSelectComponent } from './user-select.component';
import { TableEditorNoneComponent } from './table-editor-none.component';
import { GuildSelectRenderComponent } from './guild-select-render.component';
import { TableEditorInputComponent } from './table-editor-input.component';
import { TableEditorSelectComponent } from './table-editor-select.component';

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    NbCardModule,
    ThemeModule,
    Ng2SmartTableModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbSelectModule,
    NbButtonModule,
    NbAlertModule,
    NbToggleModule,
  ],
  declarations: [
    AdminComponent,
    ConfigComponent,
    BridgeConfigComponent,
    SelectRenderComponent,
    UserSelectRenderComponent,
    GuildSelectRenderComponent,
    TableSelectComponent,
    TableEditorNoneComponent,
    TableEditorInputComponent,
    TableEditorSelectComponent,
  ],
})
export class AdminModule { }
