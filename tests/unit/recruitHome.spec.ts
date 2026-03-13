import { describe, expect, it } from 'vitest'
import { canSubmitRecruitApplication } from '~/app/composables/recruit/useRecruitHome'

describe('canSubmitRecruitApplication', () => {
  it('accepte le mode existing avec un CV sélectionné', () => {
    expect(canSubmitRecruitApplication({
      hasSelectedJob: true,
      coverLetter: 'Motivation',
      resumeMode: 'existing',
      selectedResumeId: 'resume-1',
      resumeTitle: '',
      resumeDescription: '',
      uploadedResumeFile: null,
    })).toBe(true)
  })

  it('accepte le mode new si titre + description sont fournis', () => {
    expect(canSubmitRecruitApplication({
      hasSelectedJob: true,
      coverLetter: 'Motivation',
      resumeMode: 'new',
      selectedResumeId: '',
      resumeTitle: 'Frontend dev',
      resumeDescription: '5 ans experience',
      uploadedResumeFile: null,
    })).toBe(true)
  })

  it('accepte le mode pdf avec un fichier', () => {
    expect(canSubmitRecruitApplication({
      hasSelectedJob: true,
      coverLetter: 'Motivation',
      resumeMode: 'pdf',
      selectedResumeId: '',
      resumeTitle: '',
      resumeDescription: '',
      uploadedResumeFile: new File(['x'], 'cv.pdf', { type: 'application/pdf' }),
    })).toBe(true)
  })

  it('refuse si la lettre de motivation est vide', () => {
    expect(canSubmitRecruitApplication({
      hasSelectedJob: true,
      coverLetter: '   ',
      resumeMode: 'existing',
      selectedResumeId: 'resume-1',
      resumeTitle: '',
      resumeDescription: '',
      uploadedResumeFile: null,
    })).toBe(false)
  })
})
