export type TranslateFn = (key: string, params?: Record<string, unknown>) => string

export type ValidationResult<TField extends string> = {
  isValid: boolean
  fieldErrors: Partial<Record<TField, string[]>>
  summary: string[]
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PASSWORD_POLICY = {
  minLength: 12,
}

const getMessages = (errors: string[][]) => Array.from(new Set(errors.flat().filter(Boolean)))

const addFieldError = <TField extends string>(
  fieldErrors: Partial<Record<TField, string[]>>,
  field: TField,
  message: string,
) => {
  fieldErrors[field] = [...(fieldErrors[field] ?? []), message]
}

const required = <TField extends string>(
  fieldErrors: Partial<Record<TField, string[]>>,
  field: TField,
  value: string,
  label: string,
  t: TranslateFn,
) => {
  if (!value.trim()) {
    addFieldError(fieldErrors, field, t('validation.requiredField', { field: label }))
  }
}

const minLength = <TField extends string>(
  fieldErrors: Partial<Record<TField, string[]>>,
  field: TField,
  value: string,
  size: number,
  label: string,
  t: TranslateFn,
) => {
  if (value.trim() && value.trim().length < size) {
    addFieldError(fieldErrors, field, t('validation.minLength', { field: label, count: size }))
  }
}

const maxLength = <TField extends string>(
  fieldErrors: Partial<Record<TField, string[]>>,
  field: TField,
  value: string,
  size: number,
  label: string,
  t: TranslateFn,
) => {
  if (value.trim() && value.trim().length > size) {
    addFieldError(fieldErrors, field, t('validation.maxLength', { field: label, count: size }))
  }
}

const email = <TField extends string>(
  fieldErrors: Partial<Record<TField, string[]>>,
  field: TField,
  value: string,
  label: string,
  t: TranslateFn,
) => {
  if (value.trim() && !EMAIL_PATTERN.test(value.trim())) {
    addFieldError(fieldErrors, field, t('validation.invalidEmail', { field: label }))
  }
}

export type ChangePasswordFields = 'currentPassword' | 'newPassword' | 'confirmPassword'
export const validateChangePasswordForm = (
  form: { currentPassword: string, newPassword: string, confirmPassword: string },
  t: TranslateFn,
): ValidationResult<ChangePasswordFields> => {
  const fieldErrors: Partial<Record<ChangePasswordFields, string[]>> = {}

  required(fieldErrors, 'currentPassword', form.currentPassword, t('settings.password.currentPassword'), t)
  required(fieldErrors, 'newPassword', form.newPassword, t('settings.password.newPassword'), t)
  required(fieldErrors, 'confirmPassword', form.confirmPassword, t('settings.password.confirmPassword'), t)
  minLength(fieldErrors, 'newPassword', form.newPassword, PASSWORD_POLICY.minLength, t('settings.password.newPassword'), t)

  if (form.newPassword.trim() && !/[A-Z]/.test(form.newPassword)) {
    addFieldError(fieldErrors, 'newPassword', t('validation.passwordUppercase'))
  }

  if (form.newPassword.trim() && !/[a-z]/.test(form.newPassword)) {
    addFieldError(fieldErrors, 'newPassword', t('validation.passwordLowercase'))
  }

  if (form.newPassword.trim() && !/\d/.test(form.newPassword)) {
    addFieldError(fieldErrors, 'newPassword', t('validation.passwordNumber'))
  }

  if (form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword) {
    addFieldError(fieldErrors, 'confirmPassword', t('validation.passwordsDoNotMatch'))
  }

  const summary = getMessages(Object.values(fieldErrors))
  return { isValid: summary.length === 0, fieldErrors, summary }
}

export type RecruitApplyFields = 'firstName' | 'lastName' | 'email' | 'coverLetter' | 'selectedResumeId' | 'resumeTitle' | 'resumeDescription' | 'resumePdf'
export const validateRecruitApplyForm = (
  params: {
    firstName: string
    lastName: string
    email: string
    coverLetter: string
    resumeMode: 'existing' | 'new' | 'pdf'
    selectedResumeId: string
    resumeTitle: string
    resumeDescription: string
    uploadedResumeFile: File | null
  },
  t: TranslateFn,
): ValidationResult<RecruitApplyFields> => {
  const fieldErrors: Partial<Record<RecruitApplyFields, string[]>> = {}

  required(fieldErrors, 'firstName', params.firstName, t('platform.recruit.applyDialog.fields.firstName'), t)
  required(fieldErrors, 'lastName', params.lastName, t('platform.recruit.applyDialog.fields.lastName'), t)
  required(fieldErrors, 'email', params.email, t('platform.recruit.applyDialog.fields.email'), t)
  email(fieldErrors, 'email', params.email, t('platform.recruit.applyDialog.fields.email'), t)
  required(fieldErrors, 'coverLetter', params.coverLetter, t('platform.recruit.applyDialog.fields.coverLetter'), t)
  minLength(fieldErrors, 'coverLetter', params.coverLetter, 30, t('platform.recruit.applyDialog.fields.coverLetter'), t)

  if (params.resumeMode === 'existing') {
    required(fieldErrors, 'selectedResumeId', params.selectedResumeId, t('platform.recruit.applyDialog.fields.myResumes'), t)
  }

  if (params.resumeMode === 'new') {
    required(fieldErrors, 'resumeTitle', params.resumeTitle, t('platform.recruit.applyDialog.fields.experienceTitle'), t)
    required(fieldErrors, 'resumeDescription', params.resumeDescription, t('platform.recruit.applyDialog.fields.experienceDescription'), t)
  }

  if (params.resumeMode === 'pdf' && !params.uploadedResumeFile) {
    addFieldError(fieldErrors, 'resumePdf', t('validation.requiredField', { field: t('platform.recruit.applyDialog.fields.resumePdf') }))
  }

  const summary = getMessages(Object.values(fieldErrors))
  return { isValid: summary.length === 0, fieldErrors, summary }
}

export type AdminUserFields = 'username' | 'email' | 'firstName' | 'lastName' | 'password' | 'timezone' | 'language' | 'locale'
export const validateAdminUserForm = (
  form: { username: string, email: string, firstName: string, lastName: string, password: string, timezone: string, language: string, locale: string },
  mode: 'create' | 'edit' | 'patch',
  t: TranslateFn,
): ValidationResult<AdminUserFields> => {
  const fieldErrors: Partial<Record<AdminUserFields, string[]>> = {}

  if (mode === 'create') {
    required(fieldErrors, 'username', form.username, t('admin.users.form.username'), t)
  }

  required(fieldErrors, 'email', form.email, t('admin.users.form.email'), t)
  email(fieldErrors, 'email', form.email, t('admin.users.form.email'), t)
  required(fieldErrors, 'firstName', form.firstName, t('admin.users.form.firstName'), t)
  required(fieldErrors, 'lastName', form.lastName, t('admin.users.form.lastName'), t)
  required(fieldErrors, 'timezone', form.timezone, t('admin.users.form.timezone'), t)
  required(fieldErrors, 'language', form.language, t('admin.users.form.language'), t)
  required(fieldErrors, 'locale', form.locale, t('admin.users.form.locale'), t)

  if (mode === 'create') {
    required(fieldErrors, 'password', form.password, t('admin.users.form.password'), t)
    minLength(fieldErrors, 'password', form.password, PASSWORD_POLICY.minLength, t('admin.users.form.password'), t)
  }

  const summary = getMessages(Object.values(fieldErrors))
  return { isValid: summary.length === 0, fieldErrors, summary }
}

export type AdminApiKeyFields = 'description' | 'token'
export const validateAdminApiKeyForm = (
  form: { description: string, token: string },
  mode: 'create' | 'edit' | 'patch',
  t: TranslateFn,
): ValidationResult<AdminApiKeyFields> => {
  const fieldErrors: Partial<Record<AdminApiKeyFields, string[]>> = {}

  required(fieldErrors, 'description', form.description, t('admin.apiKeys.form.description'), t)
  maxLength(fieldErrors, 'description', form.description, 140, t('admin.apiKeys.form.description'), t)

  if (mode !== 'patch') {
    required(fieldErrors, 'token', form.token, t('admin.apiKeys.form.token'), t)
    minLength(fieldErrors, 'token', form.token, 16, t('admin.apiKeys.form.token'), t)
  }

  const summary = getMessages(Object.values(fieldErrors))
  return { isValid: summary.length === 0, fieldErrors, summary }
}

export type AdminUserGroupFields = 'name' | 'role'
export const validateAdminUserGroupForm = (
  form: { name: string, role: string },
  t: TranslateFn,
): ValidationResult<AdminUserGroupFields> => {
  const fieldErrors: Partial<Record<AdminUserGroupFields, string[]>> = {}

  required(fieldErrors, 'name', form.name, t('admin.userGroups.form.groupName'), t)
  required(fieldErrors, 'role', form.role, t('admin.userGroups.form.roleId'), t)

  const summary = getMessages(Object.values(fieldErrors))
  return { isValid: summary.length === 0, fieldErrors, summary }
}
