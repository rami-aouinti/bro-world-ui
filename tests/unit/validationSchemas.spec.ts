import { describe, expect, it } from 'vitest'
import {
  validateAdminApiKeyForm,
  validateAdminUserForm,
  validateAdminUserGroupForm,
  validateChangePasswordForm,
  validateRecruitApplyForm,
} from '~/app/validation/schemas'

const t = (key: string, params?: Record<string, unknown>) => {
  if (!params) {
    return key
  }

  return `${key}:${JSON.stringify(params)}`
}

describe('validation schemas', () => {
  it('valide le changement de mot de passe', () => {
    const invalid = validateChangePasswordForm({ currentPassword: '', newPassword: 'abc', confirmPassword: 'abcd' }, t)
    expect(invalid.isValid).toBe(false)
    expect(invalid.fieldErrors.currentPassword?.length).toBeGreaterThan(0)
    expect(invalid.fieldErrors.newPassword?.length).toBeGreaterThan(0)
    expect(invalid.fieldErrors.confirmPassword?.length).toBeGreaterThan(0)

    const valid = validateChangePasswordForm({ currentPassword: 'old-password', newPassword: 'StrongPassword12', confirmPassword: 'StrongPassword12' }, t)
    expect(valid.isValid).toBe(true)
  })

  it('valide la candidature recruit selon le mode de CV', () => {
    const base = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      coverLetter: 'Je suis très motivée pour ce poste et cette mission produit.',
    }

    const missingExisting = validateRecruitApplyForm({ ...base, resumeMode: 'existing', selectedResumeId: '', resumeTitle: '', resumeDescription: '', uploadedResumeFile: null }, t)
    expect(missingExisting.isValid).toBe(false)
    expect(missingExisting.fieldErrors.selectedResumeId?.length).toBeGreaterThan(0)

    const validNew = validateRecruitApplyForm({ ...base, resumeMode: 'new', selectedResumeId: '', resumeTitle: 'Dev', resumeDescription: 'Expérience complète', uploadedResumeFile: null }, t)
    expect(validNew.isValid).toBe(true)
  })

  it('valide les formulaires admin', () => {
    const userValidation = validateAdminUserForm({ username: '', email: 'x', firstName: '', lastName: '', password: '123', timezone: '', language: '', locale: '' }, 'create', t)
    expect(userValidation.isValid).toBe(false)
    expect(userValidation.summary.length).toBeGreaterThan(0)

    const apiKeyValidation = validateAdminApiKeyForm({ description: '', token: 'short' }, 'create', t)
    expect(apiKeyValidation.isValid).toBe(false)

    const groupValidation = validateAdminUserGroupForm({ name: '', role: '' }, t)
    expect(groupValidation.isValid).toBe(false)
  })
})
