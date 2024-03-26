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
import Footer from "./Footer"

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
  const [courses, setCourses] = useState<
    [string, string, string, CourseInfo][]
  >([])
  const [loading, setLoading] = useState(false)
  const [searchTime, setSearchTime] = useState(0)
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
    const startTime = Date.now()
    setLoading(true)
    const year = yearRef.current?.value
    const semester = semesterRef.current?.value
    const lecturer = lecturerRef.current?.value
    const courseName = courseNameRef.current?.value
    const courseNumber = courseNumberRef.current?.value

    const resultCourses: [string, string, string, CourseInfo][] = []

    let years = YEARS
    let semesters = Object.keys(SEMESTERS)

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
              let someLecturerHasAll = false
              for (const lecturer of group.lecturer?.split(", ") ?? []) {
                let hasAll = true
                for (const part of parts) {
                  if (!lecturer.includes(part)) {
                    hasAll = false
                    break
                  }
                }
                if (hasAll) {
                  someLecturerHasAll = true
                  break
                }
              }

              if (someLecturerHasAll) {
                hasLecturer = true
                break
              }
            }

            if (!hasLecturer) {
              continue
            }
          }

          resultCourses.push([courseId, year, semester, course])

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
    const endTime = Date.now()
    setSearchTime(endTime - startTime)
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
              flexGrow: 1,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              overflow: "auto",
            }}
          >
            <div
              style={{
                width: 400,
                maxWidth: "95%",
                display: "flex",
                flexDirection: "column",
              }}
            >
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
                ref={semesterRef}
                data={["א׳", "ב׳"]}
                leftSection={<i className="fa-solid fa-cloud-sun" />}
              />
              <TextInput
                mt="xs"
                size="md"
                ref={lecturerRef}
                label="מרצה"
                leftSection={<i className="fa-solid fa-chalkboard-user" />}
              />
              <TextInput
                size="md"
                ref={courseNameRef}
                label="שם קורס"
                leftSection={<i className="fa-solid fa-graduation-cap" />}
              />
              <TextInput
                size="md"
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
              {courses.length !== 0 && (
                <div style={{ display: "flex", marginBottom: 10 }}>
                  מספר תוצאות: {courses.length}
                  <span style={{ flexGrow: 1 }} />
                  <p>
                    זמן חיפוש: {Math.round((searchTime / 1000) * 100) / 100}s
                  </p>
                </div>
              )}
              {courses.map(([courseId, year, semester, course], index) => (
                <CourseCard
                  key={index}
                  courseId={courseId}
                  year={year}
                  semester={semester}
                  course={course}
                />
              ))}
            </div>
          </div>
          <Footer />
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
