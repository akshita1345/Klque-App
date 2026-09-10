import { Types } from "mongoose"

export interface CreateContentInput {
  hook: string
  script: string
  cta: string
  targetAudience: string
  focus: string
  postingDate: Date
  contentPillar: string
  contentType: string
  platform: string
  userId: string
}
export interface UpdateContentInput {
  hook: string
  script: string
  cta: string
  targetAudience: string
  focus: string
  contentPillar: string
  content: string
  platform: string
  postingDate: Date
  userId: string
  contentId: string
}