export interface CourseInfo {
  name: string
  faculty: string
  exams: {
    moed: string
    date: string
    hour: string
    type: string
  }[]
  groups: {
    group: string
    lecturer: string
    lessons: {
      day: string
      time: string
      building: string
      room: string
      type: string
    }[]
  }[]
}
