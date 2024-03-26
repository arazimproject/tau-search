import "@fortawesome/fontawesome-free/css/all.css"
import {
  Button,
  DirectionProvider,
  MantineProvider,
  Select,
  TextInput,
} from "@mantine/core"
import "@mantine/core/styles.css"
import { useColorScheme } from "@mantine/hooks"
import { useRef, useState } from "react"
import CourseCard from "./CourseCard"
import { CourseInfo } from "./typing"
import Header from "./Header"

const SEMESTERS: Record<string, string> = {
  "א׳": "a",
  "ב׳": "b",
}

const UNIVERSITY_SEMESTERS: Record<string, string> = {
  "א׳": "1",
  "ב׳": "2",
}

const YEARS = [
  "2007",
  "2008",
  "2009",
  "2010",
  "2011",
  "2012",
  "2013",
  "2014",
  "2015",
  "2016",
  "2017",
  "2018",
  "2019",
  "2020",
  "2021",
  "2022",
  "2023",
  "2024",
].reverse()

function App() {
  const [courses, setCourses] = useState<[string, CourseInfo][]>([])
  const [loading, setLoading] = useState(false)
  const colorScheme = useColorScheme()

  const yearRef = useRef<HTMLInputElement>(null)
  const semesterRef = useRef<HTMLInputElement>(null)
  const lecturerRef = useRef<HTMLInputElement>(null)
  const courseNameRef = useRef<HTMLInputElement>(null)
  const courseNumberRef = useRef<HTMLInputElement>(null)

  const universityFormRef = useRef<HTMLFormElement>(null)
  const universityYearRef = useRef<HTMLInputElement>(null)
  const universitySemesterRef = useRef<HTMLInputElement>(null)
  const universityLecturerRef = useRef<HTMLInputElement>(null)
  const universityCourseNameRef = useRef<HTMLInputElement>(null)
  const universityCourseNumberRef = useRef<HTMLInputElement>(null)

  const searchUniversity = () => {
    universityFormRef.current!.reset()
    universityYearRef.current!.value = yearRef.current?.value
      ? (parseInt(yearRef.current.value, 10) - 1).toString()
      : ""
    universitySemesterRef.current!.value = semesterRef.current?.value
      ? UNIVERSITY_SEMESTERS[semesterRef.current.value]
      : ""
    universityLecturerRef.current!.value = lecturerRef.current?.value ?? ""
    universityCourseNameRef.current!.value = courseNameRef.current?.value ?? ""
    if (courseNumberRef.current?.value ?? "" !== "") {
      universityCourseNumberRef.current!.value =
        courseNumberRef.current?.value ?? ""
    }
    universityFormRef.current!.submit()
  }

  const search = async () => {
    setLoading(true)
    const year = yearRef.current?.value
    const semester = semesterRef.current?.value
    const lecturer = lecturerRef.current?.value
    const courseName = courseNameRef.current?.value
    const courseNumber = courseNumberRef.current?.value

    const resultCourses: [string, CourseInfo][] = []

    let years = YEARS
    let semesters = ["a", "b"]

    if (year !== undefined && year !== "") {
      years = [year]
    }
    if (semester !== undefined && semester !== "") {
      semesters = [semester]
    }

    for (const year of years) {
      for (const semester of semesters) {
        const response = await fetch(
          "/courses/" + year + SEMESTERS[semester] + ".json"
        )
        const semesterCourses = await response.json()
        for (const courseId in semesterCourses) {
          const course = semesterCourses[courseId] as CourseInfo

          if (
            courseName !== undefined &&
            courseName !== "" &&
            !course.name.includes(courseName)
          ) {
            continue
          }

          if (
            courseNumber !== undefined &&
            courseNumber !== "" &&
            !courseId.includes(courseNumber)
          ) {
            continue
          }

          if (lecturer !== undefined && lecturer !== "") {
            const parts = lecturer.split(" ")
            let hasLecturer = false
            for (const group of course.groups) {
              let hasAll = true
              for (const part of parts) {
                if (!group.lecturer?.includes(part)) {
                  hasAll = false
                  break
                }
              }

              if (hasAll) {
                hasLecturer = true
                break
              }
            }

            if (!hasLecturer) {
              continue
            }
          }

          resultCourses.push([courseId, course])

          if (resultCourses.length >= 50) {
            break
          }
        }
        if (resultCourses.length >= 50) {
          break
        }
      }
      if (resultCourses.length >= 50) {
        break
      }
    }

    setCourses(resultCourses)
    setLoading(false)
  }

  return (
    <DirectionProvider>
      <MantineProvider forceColorScheme={colorScheme}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Header />
          <div
            style={{
              width: 400,
              maxWidth: "95%",
              height: "calc(100% - 75px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flex: "none" }}>
              <h1>חיפוש קורסים</h1>
              <Select
                ref={yearRef}
                defaultValue="2024"
                label="שנה"
                data={YEARS}
                leftSection={<i className="fa-solid fa-calendar" />}
              />
              <Select
                label="סמסטר"
                defaultValue="א׳"
                ref={semesterRef}
                data={["א׳", "ב׳"]}
                leftSection={<i className="fa-solid fa-cloud-sun" />}
              />
              <TextInput
                ref={lecturerRef}
                label="מרצה"
                leftSection={<i className="fa-solid fa-chalkboard-user" />}
              />
              <TextInput
                ref={courseNameRef}
                label="שם קורס"
                leftSection={<i className="fa-solid fa-graduation-cap" />}
              />
              <TextInput
                ref={courseNumberRef}
                label="מספר קורס"
                leftSection={<i className="fa-solid fa-hashtag" />}
              />
              <Button.Group my="lg" orientation="vertical">
                <Button
                  onClick={search}
                  fullWidth
                  leftSection={<i className="fa-solid fa-search" />}
                  loading={loading}
                >
                  חיפוש
                </Button>
                <Button
                  onClick={searchUniversity}
                  fullWidth
                  leftSection={<i className="fa-solid fa-search" />}
                >
                  חיפוש במערכת של האוניברסיטה
                </Button>
              </Button.Group>
            </div>
            <div style={{ flexGrow: 1, overflow: "auto" }}>
              {courses.length !== 0 && (
                <p style={{ marginBottom: 10 }}>
                  מספר תוצאות: {courses.length}
                </p>
              )}
              {courses.map(([courseId, course], index) => (
                <CourseCard key={index} courseId={courseId} course={course} />
              ))}
            </div>
          </div>
        </div>
        <form
          ref={universityFormRef}
          action="https://www.ims.tau.ac.il/tal/kr/Search_L.aspx"
          method="POST"
          target="_blank"
        >
          <input type="hidden" name="lstYear1" ref={universityYearRef} />
          <input type="hidden" name="txtKurs" ref={universityCourseNumberRef} />
          <input
            type="hidden"
            name="txtShemKurs"
            ref={universityCourseNameRef}
          />
          <input type="hidden" name="txtShemMore" ref={universityLecturerRef} />
          <input type="hidden" name="ckSem" ref={universitySemesterRef} />
        </form>
      </MantineProvider>
    </DirectionProvider>
  )
}

export default App
