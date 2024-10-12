import { BarChart, BarChartSeries } from "@mantine/charts"
import { Box, Chip } from "@mantine/core"
import { useState } from "react"
import { SemesterGrades } from "./typing"

const MOEDS = ["קובע", "א", "ב", "ג"]
const COLORS = [
  "violet.6",
  "blue.6",
  "teal.6",
  "lime.6",
  "yellow.6",
  "grape.6",
  "orange.6",
  "indigo.6",
  "red.6",
  "violet.2",
  "blue.2",
  "teal.2",
  "lime.2",
  "yellow.2",
  "grape.2",
  "orange.2",
  "indigo.2",
  "red.2",
]

const GradeChart = ({
  grades,
}: {
  grades: Record<string, SemesterGrades[]>
}) => {
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>(
    {}
  )
  const [visibleMoeds, setVisibleMoeds] = useState<Record<string, boolean>>({
    1: false,
    2: false,
    3: false,
  })
  const groups = Object.keys(grades).sort()
  const maxMoed = Math.max(
    ...Object.values(grades).map((grade) =>
      Math.max(...grade.map((v) => v.moed))
    )
  )

  if (maxMoed < 0) {
    return <></>
  }

  let limits: number[] = []
  for (const group in grades) {
    for (const grade of grades[group]) {
      if (grade.limits) {
        limits = grade.limits
      }
    }
  }

  if (limits.length === 0) {
    if (
      Object.values(grades).every((grades) =>
        grades.every((grade) => grade.distribution.length === 10)
      )
    ) {
      limits = [0, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100]
    } else {
      // There's a 210 missing here, hacky approach to fix it.
      limits = [0, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100, 200]
    }
  }

  const series: BarChartSeries[] = []
  let index = 0
  for (const group in grades) {
    if (visibleGroups[group] === false) {
      continue
    }

    for (const grade of grades[group]) {
      if (visibleMoeds[grade.moed] === false) {
        continue
      }

      series.push({
        name: group + " " + MOEDS[grade.moed],
        color: COLORS[index],
      })
      index++
    }
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        קבוצות:
        {groups.map((group, groupIndex) => (
          <Chip
            color="green"
            checked={visibleGroups[group] !== false}
            onChange={(c) => setVisibleGroups({ ...visibleGroups, [group]: c })}
            key={groupIndex}
            mx={5}
          >
            {group === "00" ? "כולם" : group}
          </Chip>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        מועדים:
        {new Array(maxMoed + 1).fill(0).map((_, moed) => (
          <Chip
            color="green"
            checked={visibleMoeds[moed] !== false}
            onChange={(c) => setVisibleMoeds({ ...visibleMoeds, [moed]: c })}
            key={moed}
            mx={5}
          >
            {MOEDS[moed]}
          </Chip>
        ))}
      </div>
      <Box bg="#ffffff88" p="xs" mb="xs" style={{ borderRadius: 10 }}>
        <BarChart
          mt="xs"
          h={200}
          data={limits.slice(0, -1).map((_, index) => {
            let topLimit = limits[index + 1] - 1
            if (topLimit === 99) {
              topLimit = 100
            } else if (topLimit === 199) {
              topLimit = 200
            }
            let range = `${limits[index]}-${topLimit}`
            if (range === "100-200") {
              range = "200-210"
            }
            const result: Record<string, any> = {
              range,
            }
            for (const group in grades) {
              for (const grade of grades[group]) {
                result[group + " " + MOEDS[grade.moed]] =
                  grade.distribution[index] ?? 0
              }
            }

            return result
          })}
          dataKey="range"
          series={series}
        />
      </Box>
    </>
  )
}

export default GradeChart
