export interface RecruitResumePayloadEntry {
  title: string
  description: string
}

export interface RecruitResumeEntry extends RecruitResumePayloadEntry {
  id: string
}

export interface RecruitResume {
  id: string
  documentUrl: string | null
  experiences: RecruitResumeEntry[]
  skills: RecruitResumeEntry[]
}
