import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbSelectModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { ThemeModule } from '../../@theme/theme.module';
import { AdminComponent } from './admin.component';
import { SelectRenderComponent } from './select-render.component';
import { UserSelectRenderComponent } from './user-select-render.component';
import { TableSelectComponent } from './user-select.component';
import { TableEditorNoneComponent } from './table-editor-none.component';
import { GuildSelectRenderComponent } from './guild-select-render.component';

@NgModule({
  imports: [
    NbCardModule,
    ThemeModule,
    Ng2SmartTableModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbSelectModule,
  ],
  declarations: [
    AdminComponent,
    SelectRenderComponent,
    UserSelectRenderComponent,
    GuildSelectRenderComponent,
    TableSelectComponent,
    TableEditorNoneComponent,
  ],
})
export class AdminModule { }
