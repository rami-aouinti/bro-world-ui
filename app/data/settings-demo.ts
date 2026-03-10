export const settingsKpis = [
  { label: 'Security score', value: '88%', icon: 'mdi-shield-check', color: 'success' },
  { label: 'Connected devices', value: '5', icon: 'mdi-devices', color: 'info' },
  { label: 'Linked accounts', value: '3', icon: 'mdi-link-variant', color: 'secondary' },
] as const

export const profileTips = [
  'Add a short bio so teammates understand your role quickly.',
  'Keep your phone number updated for account recovery.',
  'Set your timezone and location to improve meeting suggestions.',
] as const

export const passwordPolicyChecks = [
  { text: 'At least 12 characters', valid: true },
  { text: 'One uppercase and one lowercase letter', valid: true },
  { text: 'One number and one special character', valid: false },
] as const

export const twoFactorMethods = [
  { name: 'Security key', status: 'Not configured', action: 'Add key', icon: 'mdi-usb-flash-drive-outline' },
  { name: 'SMS backup', status: '+40 123 744 23', action: 'Edit', icon: 'mdi-message-outline' },
  { name: 'Authenticator app', status: 'Enabled on Pixel 8', action: 'Manage', icon: 'mdi-cellphone-key' },
] as const

export const backupCodes = ['AB12-CD34', 'EF56-GH78', 'JK90-LM12', 'NP34-QR56'] as const

export const socialSuggestions = [
  { provider: 'Google Workspace', description: 'Enable fast login for team members', icon: 'mdi-google' },
  { provider: 'GitHub', description: 'Sync avatar and verified email', icon: 'mdi-github' },
  { provider: 'Microsoft', description: 'Use corporate SSO policy', icon: 'mdi-microsoft' },
] as const

export const notificationChannels = [
  { channel: 'Email digest', status: 'Every weekday at 08:00' },
  { channel: 'Push alerts', status: 'Enabled on 2 devices' },
  { channel: 'Slack webhook', status: '#product-updates' },
] as const

export const sessionRiskEvents = [
  { event: 'Unknown browser login blocked', date: 'Today, 10:14', severity: 'high' },
  { event: 'Password changed', date: 'Yesterday, 18:42', severity: 'low' },
  { event: '2FA challenge successful', date: 'Mar 21, 09:05', severity: 'low' },
] as const

export const deletionConsequences = [
  'All projects and drafts owned only by you will be removed.',
  'API tokens and active sessions are revoked immediately.',
  'Billing history stays archived for legal compliance.',
] as const
