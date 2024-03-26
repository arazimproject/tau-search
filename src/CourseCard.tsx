import ColorHash from "color-hash"
import { CourseInfo } from "./typing"

const hash = new ColorHash()

const CourseCard = ({
  course,
  year,
  semester,
  courseId,
}: {
  course: CourseInfo
  year: string
  semester: string
  courseId: string
}) => {
  const courseTeachers = new Set<string>()
  for (const group of course.groups) {
    if (group.lecturer !== null && group.lecturer !== "") {
      for (const lecturer of group.lecturer.split(", ")) {
        courseTeachers.add(lecturer)
      }
    }
  }

  return (
    <div
      style={{
        marginBottom: 10,
        padding: 10,
        borderRadius: 10,
        backgroundColor: hash.hex(courseId),
        color: hash.hsl(courseId)[2] > 0.5 ? "black" : "white",
      }}
    >
      <p>
        <b style={{ marginInlineEnd: 5 }}>{course.name}</b>({course.faculty})
      </p>

      {courseTeachers.size !== 0 && (
        <p style={{ marginBottom: 10 }}>
          <b>מרצים: </b>
          {[...courseTeachers].sort().join(", ")}
        </p>
      )}

      {course.exams.map((exam, index) => (
        <p key={index}>
          <b>מועד {exam.moed}':</b> {exam.date} ב-{exam.hour}
        </p>
      ))}

      <p style={{ fontSize: 10, textAlign: "end" }}>
        {courseId} ({year}
        {semester})
      </p>
    </div>
  )
}

export default CourseCard
