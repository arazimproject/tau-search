import "@fortawesome/fontawesome-free/css/all.css"
import {
  Button,
  DirectionProvider,
  MantineProvider,
  Select,
  Switch,
  TextInput,
} from "@mantine/core"
import "@mantine/core/styles.css"
import { useColorScheme } from "@mantine/hooks"
import { useEffect, useRef, useState } from "react"
import CourseCard from "./CourseCard"
import { CourseInfo } from "./typing"
import Header from "./Header"
import Footer from "./Footer"
import { SEMESTERS, UNIVERSITY_SEMESTERS, YEARS } from "./constants"
import { useQueryParam } from "./hooks"

const getResultsForYear = async (
  year: string,
  semester: string,
  courseName: string | undefined,
  courseNumber: string | undefined,
  lecturer: string | undefined,
  showOnlyWithExams: boolean
) => {
  const results: [string, string, string, CourseInfo][] = []
  const response = await fetch(
    "https://arazim-project.com/courses/courses-" +
      year +
      SEMESTERS[semester] +
      ".json"
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

    if (showOnlyWithExams && !course.exam_links) {
      continue
    }

    results.push([courseId, year, semester, course])
  }
  return results
}

function App() {
  const [courses, setCourses] = useState<
    [string, string, string, CourseInfo][]
  >([])
  const [loading, setLoading] = useState(false)
  const [searchTime, setSearchTime] = useState(0)
  const colorScheme = useColorScheme()

  const [compactView, setCompactView] = useState("false")
  const [showOnlyWithExams, setShowOnlyWithExams] = useState("false")
  const [year, setYear] = useQueryParam("year", "2025")
  const [semester, setSemester] = useQueryParam("semester")
  const [lecturer, setLecturer] = useQueryParam("lecturer")
  const [courseName, setCourseName] = useQueryParam("courseName")
  const [courseNumber, setCourseNumber] = useQueryParam("courseNumber")

  const universityFormRef = useRef<HTMLFormElement>(null)
  const universityYearRef = useRef<HTMLInputElement>(null)
  const universitySemesterRef = useRef<HTMLInputElement>(null)
  const universityLecturerRef = useRef<HTMLInputElement>(null)
  const universityCourseNameRef = useRef<HTMLInputElement>(null)
  const universityCourseNumberRef = useRef<HTMLInputElement>(null)

  const searchUniversity = () => {
    universityFormRef.current!.reset()
    universityYearRef.current!.value = year
      ? (parseInt(year, 10) - 1).toString()
      : ""
    universitySemesterRef.current!.value = semester
      ? UNIVERSITY_SEMESTERS[semester]
      : ""
    universityLecturerRef.current!.value = lecturer ?? ""
    universityCourseNameRef.current!.value = courseName ?? ""
    if (courseNumber ?? "" !== "") {
      universityCourseNumberRef.current!.value = courseNumber
    }
    universityFormRef.current!.submit()
  }

  const search = async () => {
    const startTime = Date.now()
    setLoading(true)

    const resultCourses: [string, string, string, CourseInfo][] = []

    let years = YEARS
    let semesters = Object.keys(SEMESTERS)

    if (year !== undefined && year !== "") {
      years = [year]
    }
    if (semester !== undefined && semester !== "") {
      semesters = [semester]
    }

    const promises: Promise<[string, string, string, CourseInfo][]>[] = []
    for (const year of years) {
      for (const semester of semesters) {
        promises.push(
          getResultsForYear(
            year,
            semester,
            courseName,
            courseNumber,
            lecturer,
            showOnlyWithExams === "true"
          )
        )
      }
    }

    const promiseResults = await Promise.all(promises)
    for (const promiseResult of promiseResults) {
      for (const result of promiseResult) {
        resultCourses.push(result)

        if (resultCourses.length === 50) {
          break
        }
      }

      if (resultCourses.length === 50) {
        break
      }
    }

    setCourses(resultCourses)
    setLoading(false)
    const endTime = Date.now()
    setSearchTime(endTime - startTime)
  }

  const searchIfEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      search()
    }
  }

  useEffect(() => {
    if (window.location.search !== "") {
      search()
    }
  }, [])

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
              <Select
                mt="xs"
                value={year}
                onChange={(v) => setYear(v ?? "")}
                defaultValue="2025"
                label="שנה"
                data={YEARS}
                leftSection={<i className="fa-solid fa-calendar" />}
                size="md"
              />
              <Select
                mt="xs"
                label="סמסטר"
                value={semester}
                onChange={(v) => setSemester(v ?? "")}
                data={["א׳", "ב׳"]}
                leftSection={<i className="fa-solid fa-cloud-sun" />}
                size="md"
              />
              <TextInput
                mt="xs"
                size="md"
                value={lecturer}
                onChange={(e) => setLecturer(e.currentTarget.value)}
                label="מרצה"
                leftSection={<i className="fa-solid fa-chalkboard-user" />}
                onKeyDown={searchIfEnter}
              />
              <TextInput
                mt="xs"
                size="md"
                value={courseName}
                onChange={(e) => setCourseName(e.currentTarget.value)}
                label="שם קורס"
                leftSection={<i className="fa-solid fa-graduation-cap" />}
                onKeyDown={searchIfEnter}
              />
              <TextInput
                mt="xs"
                size="md"
                value={courseNumber}
                onChange={(e) => setCourseNumber(e.currentTarget.value)}
                label="מספר קורס"
                leftSection={<i className="fa-solid fa-hashtag" />}
                onKeyDown={searchIfEnter}
              />
              <Switch
                mt="md"
                label="הצג רק קורסים עם מבחנים"
                checked={showOnlyWithExams === "true"}
                onChange={(e) =>
                  setShowOnlyWithExams(
                    e.currentTarget.checked ? "true" : "false"
                  )
                }
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
                  leftSection={<i className="fa-solid fa-school" />}
                >
                  חיפוש במערכת של האוניברסיטה
                </Button>
              </Button.Group>
              <Switch
                mb="xs"
                label="תצוגה קומפקטית"
                checked={compactView === "true"}
                onChange={(e) =>
                  setCompactView(e.currentTarget.checked ? "true" : "false")
                }
              />

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
                  compactView={compactView === "true"}
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
