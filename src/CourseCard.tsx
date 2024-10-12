import { Button, Tooltip } from "@mantine/core"
import ColorHash from "color-hash"
import React from "react"
import { UNIVERSITY_SEMESTERS } from "./constants"
import GradeChart from "./GradeChart"
import { CourseInfo, SemesterGrades } from "./typing"

const hash = new ColorHash()

const CourseCard = ({
  course,
  year,
  semester,
  courseId,
  compactView,
  showTAUFactor,
  grades,
}: {
  course: CourseInfo
  year: string
  semester: string
  courseId: string
  compactView?: boolean
  showTAUFactor?: boolean
  grades?: Record<string, SemesterGrades[]>
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
          {grades !== undefined && showTAUFactor && (
            <GradeChart grades={grades} />
          )}
          {course.exams.map((exam, index) => (
            <p key={index}>
              <b>מועד {exam.moed}':</b>{" "}
              {exam.date ? exam.date + " ב-" + exam.hour : ""}
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
                  {lesson.type}{" "}
                  {lesson.building
                    ? "ב" + lesson.building + " " + lesson.room + " "
                    : ""}
                  {lesson.day ? "ביום " + lesson.day + "' " : ""}
                  {lesson.time ? "בשעות " + lesson.time : ""}
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
        <Tooltip
          label='זהו קישור למאגר הבחינות במודל. עליכם להיות מחוברים למודל, אחרת תופיע השגיאה "לא נמצאו כאן אורחים"'
          key={index}
        >
          <Button
            component="a"
            href={examLink}
            fullWidth
            mb="xs"
            variant="white"
            leftSection={<i className="fa-solid fa-file-pdf" />}
            target="_blank"
          >
            {
              decodeURIComponent(examLink.split("/").reverse()[0]).split(
                ".pdf"
              )[0]
            }
          </Button>
        </Tooltip>
      ))}

      <p style={{ fontSize: 12, textAlign: "end" }}>
        {courseId} ({year}
        {semester})
      </p>
    </div>
  )
}

export default CourseCard
