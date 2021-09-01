import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AdminService,
  BridgeConfig,
  Config,
  DiscordAllGuildAndChannelsInfo,
  KHLAllInfo,
  QQAllInfo
} from './admin.service';
import { TableEditorNoneComponent } from './table-editor-none.component';
import { SelectRenderComponent } from './select-render.component';
import { TableSelectComponent } from './user-select.component';
import { UserSelectRenderComponent } from './user-select-render.component';
import { LocalDataSource } from 'ng2-smart-table';
import { zip } from 'rxjs';
import { TableEditorInputComponent } from './table-editor-input.component';
import { TableEditorSelectComponent } from './table-editor-select.component';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'app-bridge-config',
  templateUrl: './bridge-config.component.html',
  styleUrls: ['./admin.component.less']
})
export class BridgeConfigComponent implements OnInit {
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
      discordChannel: {
        title: 'discord频道',
        filter: false,
        type: 'custom',
        renderComponent: SelectRenderComponent,
        editor: {
          type: 'custom',
          component: TableEditorSelectComponent,
          config: {
            list: [],
          },
        }
      },
    },
  };
  source: LocalDataSource = new LocalDataSource();
  config: Config = {} as any;
  discordInfo: DiscordAllGuildAndChannelsInfo;
  khlAllInfo: KHLAllInfo;
  qqAllInfo: QQAllInfo;

  constructor(public http: HttpClient, public adminService: AdminService, private toastrService: NbToastrService) {
    zip(this.adminService.getConfig(), this.adminService.discordAllGuildAndChannelsInfo(), this.adminService.khlAllInfo(), this.adminService.qqAllInfo())
      .subscribe(([config, discordInfo, khlAllInfo, qqAllInfo]) => {
        this.config = config;
        this.discordInfo = discordInfo;
        this.khlAllInfo = khlAllInfo;
        this.qqAllInfo = qqAllInfo;
        this.config.bridges.forEach((bridge) => {
          if (bridge.enable === undefined) {
            bridge.enable = true;
          }
        })
      })
  }

  ngOnInit(): void {
  }

  async onButtonClickSave(): Promise<void> {
    this.adminService.setConfig(this.config).subscribe((config) => {
      this.config = config;
      this.toastrService.success('保存成功');
    })
  }

  selectWebhookChange(bridge: BridgeConfig) {
    const webhook = this.discordInfo.webhooks.find(webhook => webhook.id === bridge.discord.id);
    bridge.discord.token = webhook.token;
  }
}
