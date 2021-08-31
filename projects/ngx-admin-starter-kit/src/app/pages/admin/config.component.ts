import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminService, Config } from './admin.service';
import { TableEditorNoneComponent } from './table-editor-none.component';
import { SelectRenderComponent } from './select-render.component';
import { TableSelectComponent } from './user-select.component';
import { UserSelectRenderComponent } from './user-select-render.component';
import { LocalDataSource } from 'ng2-smart-table';
import { zip } from 'rxjs';
import { TableEditorInputComponent } from './table-editor-input.component';

@Component({
  selector: 'app-admin',
  templateUrl: './config.component.html',
  styleUrls: ['./admin.component.less']
})
export class ConfigComponent implements OnInit {
  test = {
    status: 'none',
    reg: '',
    message: '',
  }

  settings = {
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: false,
    },
    actions: {
      edit: true,
      position: 'right'
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: false,
    },
    columns: {
      qqGroup: {
        title: 'qq群',
        filter: false,
        editor: {
          type: 'custom',
          component: TableEditorInputComponent,
          config: {},
        }
      },
      reg: {
        title: '正则',
        filter: false,
        editor: {
          type: 'custom',
          component: TableEditorInputComponent,
          config: {},
        }
      },
    },
  };
  source: LocalDataSource = new LocalDataSource();
  config: Config;

  constructor(public http: HttpClient, public adminService: AdminService) {
    this.adminService.getConfig().subscribe((config) => {
      this.config = config;
      this.source.load(this.config.autoApproveQQGroup);
    });
  }

  ngOnInit(): void {
  }

  async onButtonClickSave(): Promise<void> {
    const data: Array<{ qqGroup: string, reg: string }> = await this.source.getAll();
    this.config.autoApproveQQGroup = data.map((d) => {
      return {
        qqGroup: parseInt(d.qqGroup),
        reg: d.reg
      }
    });
    this.adminService.setConfig(this.config).subscribe((config)=>{
      this.config = config;
      this.source.load(this.config.autoApproveQQGroup);
    })
  }

  onChangeTest() {
    if (this.test.reg.trim() && this.test.message.trim()) {
      if (new RegExp(this.test.reg).test(this.test.message)) {
        this.test.status = 'success'
      } else {
        this.test.status = 'danger'
      }
    } else {
      this.test.status = 'none';
    }
  }
}
