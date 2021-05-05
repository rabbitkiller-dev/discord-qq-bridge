import { NgModule } from '@angular/core';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule
} from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { ThemeModule } from '../../@theme/theme.module';
import { AdminComponent } from './admin.component';
import { SelectRenderComponent } from './select-render.component';
import { UserSelectRenderComponent } from './user-select-render.component';
import { TableSelectComponent } from './user-select.component';
import { TableEditorNoneComponent } from './table-editor-none.component';
import { GuildSelectRenderComponent } from './guild-select-render.component';
import { ConfigComponent } from './config.component';
import { TableEditorInputComponent } from './table-editor-input.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  ],
  declarations: [
    AdminComponent,
    ConfigComponent,
    SelectRenderComponent,
    UserSelectRenderComponent,
    GuildSelectRenderComponent,
    TableSelectComponent,
    TableEditorNoneComponent,
    TableEditorInputComponent,
  ],
})
export class AdminModule { }
