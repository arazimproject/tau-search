import "@fortawesome/fontawesome-free/css/all.css"
import "@mantine/charts/styles.css"
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
  Tooltip,
} from "@mantine/core"
import "@mantine/core/styles.css"
import { useColorScheme } from "@mantine/hooks"
import { useEffect, useRef, useState } from "react"
import CourseCard from "./CourseCard"
import Footer from "./Footer"
import Header from "./Header"
import { SEMESTERS, UNIVERSITY_SEMESTERS } from "./constants"
import { cachedFetch, useQueryParam, useURLValue } from "./hooks"

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
  "https://arazim-project.com/data/courses-" +
  year +
  SEMESTERS[semester] +
  ".json"

const getResultsForYear = async (
  year: string,
  semester: string,
  courseName: string | undefined,
  courseNumber: string | undefined,
  lecturer: string | undefined,
  faculty: string | undefined,
  building: string | undefined,
  room: string | undefined
) => {
  const results: [string, string, string, SemesterCourseInfo][] = []
  const semesterCourses = await cachedFetch<SemesterCourses>(
    coursesUrlFor(year, semester)
  )
  for (const courseId in semesterCourses) {
    const course = semesterCourses[courseId] as SemesterCourseInfo

    if (
      courseName !== undefined &&
      courseName !== "" &&
      !stringIncludes(course.name ?? "", courseName)
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

    if (
      faculty !== undefined &&
      faculty !== "" &&
      !stringIncludes(course.faculty ?? "", faculty)
    ) {
      continue
    }

    if (
      room !== undefined &&
      room !== "" &&
      !course.groups?.some((group) =>
        group.lessons?.some((lesson) => stringIncludes(lesson.room ?? "", room))
      )
    ) {
      continue
    }

    if (
      building !== undefined &&
      building !== "" &&
      !course.groups?.some((group) =>
        group.lessons?.some((lesson) =>
          stringIncludes(lesson.building ?? "", building)
        )
      )
    ) {
      continue
    }

    if (lecturer !== undefined && lecturer !== "") {
      let hasLecturer = false
      for (const group of course.groups ?? []) {
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
    courses: [string, string, string, SemesterCourseInfo][]
  ) => [string, string, string, SemesterCourseInfo][]
> = {
  semesterDescending: (x) => x,
  semesterAscending: (x) => x.reverse(),
  courseName: (x) => x.sort((a, b) => a[3].name!.localeCompare(b[3].name!)),
  facultyName: (x) =>
    x.sort((a, b) => a[3].faculty!.localeCompare(b[3].faculty!)),
}

let allCourseInfo: any = {}

const App = () => {
  const [grades, setGrades] = useState<AllTimeGrades>({})
  const [courses, setCourses] = useState<
    [string, string, string, SemesterCourseInfo][]
  >([]) // All courses matching search parameters above the search button.
  const [filteredCourses, setFilteredCourses] = useState<
    [string, string, string, SemesterCourseInfo][]
  >([]) // Filtered/sorted `courses`, using the parameters below the search button.
  const [loading, setLoading] = useState(false)
  const [searchTime, setSearchTime] = useState(0)
  const colorScheme = useColorScheme()

  const [editSearch, setEditSearch] = useQueryParam("edit", "true")
  const [compactView, setCompactView] = useQueryParam("compactView", "false")
  const [showOnlyWithExams, setShowOnlyWithExams] = useQueryParam(
    "showOnlyWithExams",
    "false"
  )
  const [showTAUFactor, setShowTAUFactor] = useQueryParam(
    "showTAUFactor",
    "false"
  )
  const [year, setYear] = useQueryParam("year")
  const [semester, setSemester] = useQueryParam("semester")
  const [lecturer, setLecturer] = useQueryParam("lecturer")
  const [courseName, setCourseName] = useQueryParam("courseName")
  const [courseNumber, setCourseNumber] = useQueryParam("courseNumber")
  const [faculty, setFaculty] = useQueryParam("faculty")
  const [building, setBuilding] = useQueryParam("building")
  const [room, setRoom] = useQueryParam("room")

  const universityFormRef = useRef<HTMLFormElement>(null)
  const universityYearRef = useRef<HTMLInputElement>(null)
  const universitySemesterRef = useRef<HTMLInputElement>(null)
  const universityLecturerRef = useRef<HTMLInputElement>(null)
  const universityCourseNameRef = useRef<HTMLInputElement>(null)
  const universityCourseNumberRef = useRef<HTMLInputElement>(null)

  const [generalInfo] = useURLValue<GeneralInfo>(
    "https://arazim-project.com/data/info.json"
  )
  const [allLecturers, setAllLecturers] = useState<string[]>([])
  const [allCourseNames, setAllCourseNames] = useState<string[]>([])
  const [allCourseNumbers, setAllCourseNumbers] = useState<string[]>([])
  const [allFaculties, setAllFaculties] = useState<string[]>([])
  const [allBuildings, setAllBuildings] = useState<string[]>([])
  const [allRooms, setAllRooms] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [performedSearch, setPerformedSearch] = useState(false)
  const [activePage, setActivePage] = useQueryParam("page", "1")
  const [sortMethod, setSortMethod] = useQueryParam(
    "sortBy",
    "semesterDescending"
  )

  const years = [
    ...new Set(
      Object.keys(generalInfo.semesters ?? {}).map((semester) =>
        semester.slice(0, 4)
      )
    ),
  ]
    .sort()
    .reverse()

  const clearStatus = () => setStatus("")

  useEffect(() => {
    let result = courses
    if (showOnlyWithExams === "true") {
      result = result.filter(
        (course) =>
          course[3].exam_links?.length !== undefined &&
          course[3].exam_links.length > 0
      )
    }
    setFilteredCourses(sortMethods[sortMethod]([...result]))
  }, [courses, showOnlyWithExams, sortMethod])

  useEffect(() => {
    setStatus("טוען מידע על כל הקורסים להשלמה אוטומטית...")
    fetch("https://arazim-project.com/data/courses.json")
      .then((r) => r.json())
      .then(async (allCourses: AllTimeCourses) => {
        allCourseInfo = allCourses

        const allCourseNumbers = []
        const allCourseNames = new Set<string>()
        const allLecturers = new Set<string>()
        const allFaculties = new Set<string>()
        for (const courseId in allCourses) {
          allCourseNumbers.push(courseId)
          if (allCourses[courseId]?.name) {
            allCourseNames.add(allCourses[courseId].name)
          }
          for (const lecturer of allCourses[courseId]?.lecturers ?? []) {
            allLecturers.add(lecturer)
          }
          if (allCourses[courseId]?.faculty) {
            allFaculties.add(allCourses[courseId].faculty)
          }
        }
        setAllCourseNumbers(allCourseNumbers.sort())
        setAllCourseNames([...allCourseNames].sort())
        setAllLecturers([...allLecturers].sort())
        setAllFaculties([...allFaculties].sort())

        const generalInfo = await cachedFetch(
          "https://arazim-project.com/data/info.json"
        )
        const years = [
          ...new Set(
            Object.keys(generalInfo.semesters ?? {}).map((semester) =>
              semester.slice(0, 4)
            )
          ),
        ]
          .sort()
          .reverse()

        const promises: Promise<any>[] = []
        setStatus("טוען מראש את כל הקורסים כדי להאיץ את החיפוש...")
        for (const year of years) {
          for (const semester of Object.keys(SEMESTERS).sort().reverse()) {
            promises.push(
              cachedFetch<SemesterCourses>(coursesUrlFor(year, semester))
            )
          }
        }
        await Promise.all(promises)
        setStatus("טוען את הציונים מ-TAU Factor...")
        const grades = await cachedFetch<AllTimeGrades>(
          "https://arazim-project.com/data/grades.json"
        )
        setGrades(grades)
        // Generate allBuildings and allRooms from last semester
        const courses = await cachedFetch<SemesterCourses>(
          coursesUrlFor(years[0], "א׳")
        )
        const allBuildings = new Set<string>()
        const allRooms = new Set<string>()
        for (const course of Object.values(courses)) {
          for (const group of course?.groups ?? []) {
            for (const lesson of group.lessons ?? []) {
              if (lesson?.building) {
                allBuildings.add(lesson.building)
              }
              if (lesson?.room) {
                allRooms.add(lesson.room)
              }
            }
          }
        }
        setAllBuildings([...allBuildings].sort())
        setAllRooms([...allRooms].sort())
        clearStatus()
      })
      .catch(clearStatus)
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

    const resultCourses: [string, string, string, SemesterCourseInfo][] = []

    let semesters = Object.keys(SEMESTERS).sort().reverse()

    let searchYears = years
    if (year !== undefined && year !== "") {
      searchYears = [year]
    }
    if (semester !== undefined && semester !== "") {
      semesters = [semester]
    }

    const promises: Promise<[string, string, string, SemesterCourseInfo][]>[] =
      []
    for (const year of searchYears) {
      for (const semester of semesters) {
        promises.push(
          getResultsForYear(
            year,
            semester,
            courseName,
            // Remove the course name that's added for readibility only.
            courseNumber.split("(")[0].trim(),
            lecturer,
            faculty,
            building,
            room
          )
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

  let universityUnavailableReason = ""
  if (year === "") {
    universityUnavailableReason = "חיפוש לאורך כל השנים"
  } else if (lecturer === "" && courseName === "" && courseNumber === "") {
    universityUnavailableReason = "חיפוש ללא מספר/שם קורס וללא שם מורה"
  } else if (building !== "") {
    universityUnavailableReason = "חיפוש לפי בניין"
  } else if (room !== "") {
    universityUnavailableReason = "חיפוש לפי חדר"
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
              {status !== "" && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader size="sm" ml="xs" />
                  {status}
                </div>
              )}
              <Button
                mt="xs"
                leftSection={
                  <i
                    className={
                      editSearch === "true"
                        ? "fa-solid fa-chevron-up"
                        : "fa-solid fa-chevron-down"
                    }
                  />
                }
                fullWidth
                flex="none"
                onClick={() =>
                  setEditSearch(editSearch === "true" ? "false" : "true")
                }
              >
                {editSearch === "true" ? "הסתר" : "הצג"} פרמטרים לחיפוש
              </Button>

              {editSearch === "true" && (
                <>
                  <Select
                    mt="xs"
                    value={year}
                    onChange={(v) => setYear(v ?? "")}
                    label="שנה"
                    data={years}
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
                    leftSection={
                      allLecturers.length === 0 ? (
                        <Loader size="xs" />
                      ) : (
                        <i className="fa-solid fa-chalkboard-user" />
                      )
                    }
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
                    leftSection={
                      allCourseNames.length === 0 ? (
                        <Loader size="xs" />
                      ) : (
                        <i className="fa-solid fa-graduation-cap" />
                      )
                    }
                    onKeyDown={searchIfEnter}
                    data={allCourseNames}
                    limit={20}
                  />
                  <Autocomplete
                    mt="xs"
                    value={courseNumber}
                    onChange={setCourseNumber}
                    label="מספר קורס"
                    leftSection={
                      allCourseNumbers.length === 0 ? (
                        <Loader size="xs" />
                      ) : (
                        <i className="fa-solid fa-hashtag" />
                      )
                    }
                    onKeyDown={searchIfEnter}
                    data={allCourseNumbers.map(
                      (courseNumber) =>
                        `${courseNumber} (${allCourseInfo[courseNumber]?.name})`
                    )}
                    limit={20}
                  />
                  <Autocomplete
                    mt="xs"
                    value={faculty}
                    onChange={setFaculty}
                    label="פקולטה"
                    leftSection={
                      allFaculties.length === 0 ? (
                        <Loader size="xs" />
                      ) : (
                        <i className="fa-solid fa-school" />
                      )
                    }
                    onKeyDown={searchIfEnter}
                    data={allFaculties}
                    limit={20}
                  />
                  <Autocomplete
                    mt="xs"
                    value={building}
                    onChange={setBuilding}
                    label="בניין"
                    leftSection={
                      allBuildings.length === 0 ? (
                        <Loader size="xs" />
                      ) : (
                        <i className="fa-solid fa-building-user" />
                      )
                    }
                    onKeyDown={searchIfEnter}
                    data={allBuildings}
                    limit={20}
                  />
                  <Autocomplete
                    mt="xs"
                    value={room}
                    onChange={setRoom}
                    label="חדר"
                    leftSection={
                      allRooms.length === 0 ? (
                        <Loader size="xs" />
                      ) : (
                        <i className="fa-solid fa-door-closed" />
                      )
                    }
                    onKeyDown={searchIfEnter}
                    data={allRooms}
                    limit={20}
                  />

                  <Button.Group mt="md" orientation="vertical">
                    <Button
                      onClick={() => search()}
                      fullWidth
                      leftSection={<i className="fa-solid fa-search" />}
                      loading={loading}
                    >
                      חיפוש
                    </Button>
                    <Tooltip
                      // Hack to show tooltip optionally
                      events={
                        universityUnavailableReason === ""
                          ? { hover: false, focus: false, touch: false }
                          : undefined
                      }
                      label={
                        "מערכת החיפוש של האוניברסיטה לא תומכת ב" +
                        universityUnavailableReason
                      }
                    >
                      <Button
                        onClick={searchUniversity}
                        fullWidth
                        leftSection={<i className="fa-solid fa-school" />}
                        disabled={universityUnavailableReason !== ""}
                      >
                        חיפוש במערכת של האוניברסיטה
                      </Button>
                    </Tooltip>
                  </Button.Group>
                </>
              )}
              <Switch
                mt="xs"
                label="הצג רק קורסים עם מבחנים"
                checked={showOnlyWithExams === "true"}
                onChange={(e) =>
                  setShowOnlyWithExams(
                    e.currentTarget.checked ? "true" : "false"
                  )
                }
              />
              <Switch
                mt="xs"
                label="הצג ציונים מ-TAU Factor"
                checked={showTAUFactor === "true"}
                onChange={(e) =>
                  setShowTAUFactor(e.currentTarget.checked ? "true" : "false")
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
              <p>
                <i
                  className="fa-solid fa-arrow-down-a-z"
                  style={{ marginInlineEnd: 5 }}
                />
                מיין לפי...
              </p>
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
                    showTAUFactor={showTAUFactor === "true"}
                    courseId={courseId}
                    year={year}
                    semester={semester}
                    course={course}
                    grades={
                      (grades[courseId] ?? {})[
                        (parseInt(year, 10) - 1).toString() +
                          SEMESTERS[semester]
                      ]
                    }
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
                    total={Math.ceil(filteredCourses.length / RESULTS_PER_PAGE)}
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
