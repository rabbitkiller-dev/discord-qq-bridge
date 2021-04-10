import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { HttpClient } from '@angular/common/http';
import { SelectRenderComponent } from './select-render.component';
import { AdminService } from './admin.service';
import { zip } from 'rxjs';
import { UserSelectRenderComponent } from './user-select-render.component';
import { TableSelectComponent } from './user-select.component';
import { TableEditorNoneComponent } from './table-editor-none.component';
import { GuildSelectRenderComponent } from './guild-select-render.component';

// import { SmartTableData } from '../../../@core/data/smart-table';
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.less']
})
export class AdminComponent implements OnInit {
  guild: string = '';
  settings = {
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: true,
    },
    actions: {
      edit: false,
      position: 'right'
    },
    // edit: {
    //   editButtonContent: '<i class="nb-edit"></i>',
    //   saveButtonContent: '<i class="nb-checkmark"></i>',
    //   cancelButtonContent: '<i class="nb-close"></i>',
    // },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      id: {
        title: 'ID',
        type: 'number',
        filter: false,
        editable: false,
        editor: {
          type: 'custom',
          component: TableEditorNoneComponent,
        },
      },
      // guild: {
      //   title: '伺服务器',
      //   filter: false,
      //   type: 'custom',
      //   renderComponent: GuildSelectRenderComponent,
      //   editor: {
      //     type: 'custom',
      //     component: TableEditorNoneComponent,
      //     config: {
      //       list: [],
      //     },
      //   }
      // },
      channel: {
        title: '频道',
        filter: false,
        type: 'custom',
        renderComponent: SelectRenderComponent,
        editor: {
          type: 'custom',
          component: TableSelectComponent,
          config: {
            list: [],
          },
        }
      },
      user: {
        title: '用户',
        filter: false,
        type: 'custom',
        renderComponent: UserSelectRenderComponent,
        editor: {
          type: 'custom',
          component: TableSelectComponent,
          config: {
            list: [],
          },
        }
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(public http: HttpClient, public adminService: AdminService) {
    this.adminService.getGuilds().subscribe();
  }

  ngOnInit(): void {
  }

  onSelectedChange($event: string) {
    this.guild = $event;
    zip(this.adminService.getGuildAllChannel($event), this.adminService.getGuildAllUsers($event), this.adminService.getAllDToQUserLimit($event)).subscribe((result) => {
      // this.settings.columns.guild.editor.config.list = this.adminService.guilds.map((channel) => {
      //   return {value: channel.id, title: channel.name};
      // });
      this.settings.columns.channel.editor.config.list = this.adminService.channels.map((channel) => {
        return {value: channel.id, title: channel.name};
      });
      this.settings.columns.user.editor.config.list = this.adminService.users.map((user) => {
        return {value: user.id, title: `${user.username}#${user.discriminator}${user.bot ? '[机器人]' : ''}`}
      })
      this.settings = {...this.settings}
      this.source.load(result[2]);
    })
  }

  onDeleteConfirm($event): void {
    if (window.confirm('Are you sure you want to delete?')) {
      console.log($event)
      this.adminService.deleteAllDToQUserLimit($event.data.id).subscribe(() => {
        $event.confirm.resolve();
      }, () => {
        $event.confirm.reject();
      })
    } else {
      $event.confirm.reject();
    }
  }

  onCreateConfirm($event): void {
    if ($event.newData.channel && $event.newData.user) {
      $event.newData.guild = this.guild;
      this.adminService.saveAllDToQUserLimit({
        guild: this.guild,
        channel: $event.newData.channel,
        user: $event.newData.user
      }).subscribe(() => {
        $event.confirm.resolve();
      }, () => {
        $event.confirm.reject();
      })
    } else {
      $event.confirm.reject();
    }
  }

}
