import { useState } from "react"

export const useQueryParam = (
  param: string,
  defaultValue = ""
): [string, (v: string) => void] => {
  const params = new URLSearchParams(window.location.search)
  const [value, setValue] = useState(params.get(param) ?? defaultValue)

  const setQueryParamAndValue = (v: string) => {
    if (v === defaultValue && params.has(param)) {
      params.delete(param)
    } else {
      params.set(param, v)
    }
    if (params.toString() !== "") {
      history.pushState({}, "", location.pathname + "?" + params.toString())
    } else {
      history.pushState({}, "", location.pathname)
    }

    setValue(v)
  }

  return [value, setQueryParamAndValue]
}
