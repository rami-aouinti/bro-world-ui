export const settingsNavItems = [
  { icon: 'mdi-account-edit-outline', text: 'Basic info', to: '/settings/basic-info' },
  { icon: 'mdi-lock-reset', text: 'Change password', to: '/settings/change-password' },
  { icon: 'mdi-shield-key-outline', text: 'Two-factor auth', to: '/settings/two-factor' },
  { icon: 'mdi-account-multiple-outline', text: 'Connected accounts', to: '/settings/accounts' },
  { icon: 'mdi-bell-badge-outline', text: 'Notifications', to: '/settings/notifications' },
  { icon: 'mdi-monitor-account', text: 'Sessions', to: '/settings/sessions' },
  { icon: 'mdi-alert-outline', text: 'Delete account', to: '/settings/delete-account' },
] as const
