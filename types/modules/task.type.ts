export interface CreateTaskInput {
  title: string
  priority: string
  date: Date
  contentId: string
  userId: string
}
export interface UpdateTaskInput {
  title?: string
  priority?: string
  date?: Date
  isCompleted?: boolean
  taskId: string
  contentId?: string
  userId: string
}