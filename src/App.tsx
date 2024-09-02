import "@fortawesome/fontawesome-free/css/all.css"
import {
  Autocomplete,
  Button,
  ComboboxItem,
  DirectionProvider,
  Loader,
  MantineProvider,
  OptionsFilter,
  Pagination,
  SegmentedControl,
  Select,
  Switch,
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

const RESULTS_PER_PAGE = 10

const stringIncludes = (x: string, y: string) =>
  x.toLowerCase().includes(y.toLowerCase())

const stringIncludesWords = (x: string, y: string) => {
  const parts = y.split(" ")
  for (const part of parts) {
    if (!x.includes(part)) {
      return false
    }
  }
  return true
}

const lecturerFilter: OptionsFilter = ({ options, search, limit }) => {
  const results: ComboboxItem[] = []
  let i = 0
  while (results.length < limit && i < options.length) {
    const option = options[i] as ComboboxItem
    if (stringIncludesWords(option.label, search)) {
      results.push(option)
    }

    i++
  }
  return results
}

const coursesUrlFor = (year: string, semester: string) =>
  "https://arazim-project.com/courses/courses-" +
  year +
  SEMESTERS[semester] +
  ".json"

const requestCache: Record<string, any> = {}
const requestPromises: Record<string, Promise<any>> = {}
const cachedFetchJson = async (url: string) => {
  if (requestCache[url] !== undefined) {
    return requestCache[url]
  }
  if (requestPromises[url] === undefined) {
    requestPromises[url] = fetch(url).then((r) => r.json())
  }
  const json = await requestPromises[url]
  requestCache[url] = json
  return json
}

const getResultsForYear = async (
  year: string,
  semester: string,
  courseName: string | undefined,
  courseNumber: string | undefined,
  lecturer: string | undefined
) => {
  const results: [string, string, string, CourseInfo][] = []
  const semesterCourses = await cachedFetchJson(coursesUrlFor(year, semester))
  for (const courseId in semesterCourses) {
    const course = semesterCourses[courseId] as CourseInfo

    if (
      courseName !== undefined &&
      courseName !== "" &&
      !stringIncludes(course.name, courseName)
    ) {
      continue
    }

    if (
      courseNumber !== undefined &&
      courseNumber !== "" &&
      !stringIncludes(courseId, courseNumber)
    ) {
      continue
    }

    if (lecturer !== undefined && lecturer !== "") {
      let hasLecturer = false
      for (const group of course.groups) {
        for (const l of group.lecturer?.split(", ") ?? []) {
          if (stringIncludesWords(l, lecturer)) {
            hasLecturer = true
            break
          }
        }

        if (hasLecturer) {
          break
        }
      }

      if (!hasLecturer) {
        continue
      }
    }

    results.push([courseId, year, semester, course])
  }
  return results
}

const sortMethods: Record<
  string,
  (
    courses: [string, string, string, CourseInfo][]
  ) => [string, string, string, CourseInfo][]
> = {
  semesterDescending: (x) => x,
  semesterAscending: (x) => x.reverse(),
  courseName: (x) => x.sort((a, b) => a[3].name.localeCompare(b[3].name)),
  facultyName: (x) =>
    x.sort((a, b) => a[3].faculty.localeCompare(b[3].faculty)),
}

const App = () => {
  const [courses, setCourses] = useState<
    [string, string, string, CourseInfo][]
  >([]) // All courses matching search parameters above the search button.
  const [filteredCourses, setFilteredCourses] = useState<
    [string, string, string, CourseInfo][]
  >([]) // Filtered/sorted `courses`, using the parameters below the search button.
  const [loading, setLoading] = useState(false)
  const [searchTime, setSearchTime] = useState(0)
  const colorScheme = useColorScheme()

  const [compactView, setCompactView] = useQueryParam("compactView", "false")
  const [showOnlyWithExams, setShowOnlyWithExams] = useQueryParam(
    "showOnlyWithExams",
    "false"
  )
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

  const [allLecturers, setAllLecturers] = useState<string[]>([])
  const [allCourseNames, setAllCourseNames] = useState<string[]>([])
  const [allCourseNumbers, setAllCourseNumbers] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [performedSearch, setPerformedSearch] = useState(false)
  const [activePage, setActivePage] = useQueryParam("page", "1")
  const [sortMethod, setSortMethod] = useQueryParam(
    "sortBy",
    "semesterDescending"
  )

  const clearStatus = () => setStatus("")

  useEffect(() => {
    let result = courses
    if (showOnlyWithExams === "true") {
      result = courses.filter(
        (course) =>
          course[3].exam_links?.length !== undefined &&
          course[3].exam_links.length > 0
      )
    }
    setFilteredCourses(sortMethods[sortMethod]([...result]))
  }, [courses, showOnlyWithExams, sortMethod])

  useEffect(() => {
    setStatus("טוען מידע על כל הקורסים להשלמה אוטומטית...")
    fetch("https://arazim-project.com/courses/courses.json")
      .then((r) => r.json())
      .then((allCourses) => {
        const allCourseNumbers = []
        const allCourseNames = new Set<string>()
        const allLecturers = new Set<string>()
        for (const courseId in allCourses) {
          allCourseNumbers.push(courseId)
          allCourseNames.add(allCourses[courseId].name)
          for (const lecturer of allCourses[courseId].lecturers) {
            allLecturers.add(lecturer)
          }
        }
        setAllCourseNumbers(allCourseNumbers.sort())
        setAllCourseNames([...allCourseNames].sort())
        setAllLecturers([...allLecturers].sort())
        clearStatus()
      })
      .catch(clearStatus)

    const promises: Promise<any>[] = []
    setStatus("טוען מראש את כל הקורסים כדי להאיץ את החיפוש...")
    for (const year of YEARS) {
      for (const semester of Object.keys(SEMESTERS).sort().reverse()) {
        promises.push(cachedFetchJson(coursesUrlFor(year, semester)))
      }
    }
    Promise.all(promises).then(clearStatus).catch(clearStatus)
  }, [])

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

  const search = async (initialFetch = false) => {
    const startTime = Date.now()
    setLoading(true)
    setPerformedSearch(false)

    const resultCourses: [string, string, string, CourseInfo][] = []

    let years = YEARS
    let semesters = Object.keys(SEMESTERS).sort().reverse()

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
          getResultsForYear(year, semester, courseName, courseNumber, lecturer)
        )
      }
    }

    const promiseResults = await Promise.all(promises)
    for (const promiseResult of promiseResults) {
      for (const result of promiseResult) {
        resultCourses.push(result)
      }
    }

    if (!initialFetch) {
      setActivePage("1")
    }
    setCourses(resultCourses)
    setLoading(false)
    const endTime = Date.now()
    setSearchTime(endTime - startTime)
    setPerformedSearch(true)
  }

  const searchIfEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      search()
    }
  }

  useEffect(() => {
    if (window.location.search !== "") {
      search(true)
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
              <h1 style={{ textAlign: "center", marginTop: 10 }}>
                חיפוש קורסים
              </h1>
              {status !== "" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader size="sm" ml="xs" />
                  {status}
                </div>
              )}
              <Select
                mt="xs"
                value={year}
                onChange={(v) => setYear(v ?? "")}
                defaultValue="2025"
                label="שנה"
                data={YEARS}
                leftSection={<i className="fa-solid fa-calendar" />}
                clearable
              />
              <Select
                mt="xs"
                label="סמסטר"
                value={semester}
                onChange={(v) => setSemester(v ?? "")}
                data={["א׳", "ב׳"]}
                leftSection={<i className="fa-solid fa-cloud-sun" />}
                clearable
              />
              <Autocomplete
                mt="xs"
                value={lecturer}
                onChange={setLecturer}
                label="מרצה"
                leftSection={<i className="fa-solid fa-chalkboard-user" />}
                onKeyDown={searchIfEnter}
                data={allLecturers}
                limit={20}
                filter={lecturerFilter}
              />
              <Autocomplete
                mt="xs"
                value={courseName}
                onChange={setCourseName}
                label="שם קורס"
                leftSection={<i className="fa-solid fa-graduation-cap" />}
                onKeyDown={searchIfEnter}
                data={allCourseNames}
                limit={20}
              />
              <Autocomplete
                mt="xs"
                value={courseNumber}
                onChange={setCourseNumber}
                label="מספר קורס"
                leftSection={<i className="fa-solid fa-hashtag" />}
                onKeyDown={searchIfEnter}
                data={allCourseNumbers}
                limit={20}
              />

              <Button.Group my="md" orientation="vertical">
                <Button
                  onClick={() => search()}
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
                label="הצג רק קורסים עם מבחנים"
                checked={showOnlyWithExams === "true"}
                onChange={(e) =>
                  setShowOnlyWithExams(
                    e.currentTarget.checked ? "true" : "false"
                  )
                }
              />
              <Switch
                my="xs"
                label="תצוגה קומפקטית"
                checked={compactView === "true"}
                onChange={(e) =>
                  setCompactView(e.currentTarget.checked ? "true" : "false")
                }
              />
              <p>מיין לפי...</p>
              <SegmentedControl
                my="xs"
                flex="none"
                data={[
                  { label: "ישן לחדש", value: "semesterAscending" },
                  { label: "חדש לישן", value: "semesterDescending" },
                  { label: "שם קורס", value: "courseName" },
                  { label: "שם פקולטה", value: "facultyName" },
                ]}
                value={sortMethod}
                onChange={setSortMethod}
              />

              {filteredCourses.length === 0 && performedSearch && (
                <p style={{ textAlign: "center" }}>לא נמצאו תוצאות.</p>
              )}
              {filteredCourses.length !== 0 && (
                <>
                  <div style={{ display: "flex", marginBottom: 10 }}>
                    מספר תוצאות: {filteredCourses.length}
                    <span style={{ flexGrow: 1 }} />
                    <p>
                      זמן חיפוש: {Math.round((searchTime / 1000) * 100) / 100}s
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {filteredCourses.length > 10 && (
                      <Pagination
                        total={Math.ceil(
                          filteredCourses.length / RESULTS_PER_PAGE
                        )}
                        value={parseInt(activePage, 10)}
                        onChange={(v) => setActivePage(v.toString())}
                        mb="xs"
                      />
                    )}
                  </div>
                </>
              )}
              {filteredCourses
                .slice(
                  RESULTS_PER_PAGE * (parseInt(activePage, 10) - 1),
                  RESULTS_PER_PAGE * parseInt(activePage, 10)
                )
                .map(([courseId, year, semester, course], index) => (
                  <CourseCard
                    key={index}
                    compactView={compactView === "true"}
                    courseId={courseId}
                    year={year}
                    semester={semester}
                    course={course}
                  />
                ))}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {filteredCourses.length > 10 && (
                    <Pagination
                      total={Math.ceil(
                        filteredCourses.length / RESULTS_PER_PAGE
                      )}
                      value={parseInt(activePage, 10)}
                      onChange={(v) => setActivePage(v.toString())}
                      mb="xs"
                    />
                  )}
                </div>
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
