import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Dashboard',
    icon: 'home-outline',
    link: '/pages/dashboard',
    home: false,
  },
  {
    title: '消息桥设置',
    icon: 'home-outline',
    link: '/pages/bridge-config',
    home: true,
  },
  {
    title: 'QQ群自动同意审批',
    icon: 'home-outline',
    link: '/pages/config',
    home: false,
  },
  {
    title: '桥同步设置',
    icon: 'home-outline',
    link: '/pages/admin',
    home: false,
  },
  {
    title: 'FEATURES',
    group: true,
  },
  {
    title: 'Auth',
    icon: 'lock-outline',
    children: [
      {
        title: 'Login',
        link: '/auth/login',
      },
      {
        title: 'Register',
        link: '/auth/register',
      },
      {
        title: 'Request Password',
        link: '/auth/request-password',
      },
      {
        title: 'Reset Password',
        link: '/auth/reset-password',
      },
    ],
  },
];
