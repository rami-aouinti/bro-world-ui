export const settingsNavItems = [
  { icon: 'mdi-account', text: 'Profile', to: '/settings/profile' },
  { icon: 'mdi-card-account-details-outline', text: 'Basic Info', to: '/settings/basic-info' },
  { icon: 'mdi-lock', text: 'Change Password', to: '/settings/change-password' },
  { icon: 'mdi-shield-outline', text: '2FA', to: '/settings/two-factor' },
  { icon: 'mdi-badge-account-outline', text: 'Accounts', to: '/settings/accounts' },
  { icon: 'mdi-bullhorn-outline', text: 'Notifications', to: '/settings/notifications' },
  { icon: 'mdi-cog-outline', text: 'Sessions', to: '/settings/sessions' },
  { icon: 'mdi-delete-outline', text: 'Delete Account', to: '/settings/delete-account' },
] as const
