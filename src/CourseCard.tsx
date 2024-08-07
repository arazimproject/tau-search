import ColorHash from "color-hash"
import { CourseInfo } from "./typing"
import { Button } from "@mantine/core"
import { UNIVERSITY_SEMESTERS } from "./constants"
import React from "react"

const hash = new ColorHash()

const CourseCard = ({
  course,
  year,
  semester,
  courseId,
  compactView,
}: {
  course: CourseInfo
  year: string
  semester: string
  courseId: string
  compactView?: boolean
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

      {compactView || (
        <>
          {course.exams.map((exam, index) => (
            <p key={index}>
              <b>מועד {exam.moed}':</b> {exam.date} ב-{exam.hour}
            </p>
          ))}

          {course.groups.map((group, index) => (
            <React.Fragment key={index}>
              <p>
                <b>
                  {group.lecturer} (קבוצה {group.group})
                </b>
              </p>
              {group.lessons.map((lesson, lessonIndex) => (
                <p key={lessonIndex}>
                  {lesson.type} ב{lesson.building} {lesson.room} ביום{" "}
                  {lesson.day}' בשעות {lesson.time}
                </p>
              ))}
            </React.Fragment>
          ))}

          <Button.Group my="xs">
            <Button
              component="a"
              target="_blank"
              href={`https://www.ims.tau.ac.il/Tal/Syllabus/Syllabus_L.aspx?course=${courseId}${
                course.groups[0].group
              }&year=${parseInt(year, 10) - 1}`}
              variant="white"
              style={{ width: "50%" }}
              leftSection={<i className="fa-solid fa-graduation-cap" />}
            >
              סילבוס
            </Button>
            <Button
              component="a"
              href={`https://www.ims.tau.ac.il/Tal/kr/Drishot_L.aspx?kurs=${courseId}&kv=${
                course.groups[0].group
              }&sem=${parseInt(year, 10) - 1}${UNIVERSITY_SEMESTERS[semester]}`}
              target="_blank"
              variant="white"
              style={{ width: "50%" }}
              leftSection={<i className="fa-solid fa-list" />}
            >
              דרישות קדם
            </Button>
          </Button.Group>
        </>
      )}

      {(course.exam_links ?? []).map((examLink, index) => (
        <Button
          component="a"
          href={examLink}
          key={index}
          fullWidth
          mb="xs"
          variant="white"
          leftSection={<i className="fa-solid fa-file-pdf" />}
        >
          {
            decodeURIComponent(examLink.split("/").reverse()[0]).split(
              ".pdf"
            )[0]
          }
        </Button>
      ))}

      <p style={{ fontSize: 12, textAlign: "end" }}>
        {courseId} ({year}
        {semester})
      </p>
    </div>
  )
}

export default CourseCard
