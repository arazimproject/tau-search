import { useEffect, useState } from "react"

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

const cachedUrlValues: Record<string, any> = {}
const fetchUrlValuePromises: Record<string, Promise<any>> = {}

export const cachedFetch = async <T = any>(url: string): Promise<T> => {
  if (cachedUrlValues[url] !== undefined) {
    return cachedUrlValues[url]
  }

  if (fetchUrlValuePromises[url] === undefined) {
    fetchUrlValuePromises[url] = fetch(url).then((r) => r.json())
  }

  const result = await fetchUrlValuePromises[url]
  return result
}

export const useURLValue = <T>(url: string): [Partial<T>, boolean] => {
  const [value, setValue] = useState<Partial<T>>(cachedUrlValues[url] ?? {})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initialValue = cachedUrlValues[url] ?? {}
    // Already loaded
    if (Object.keys(initialValue).length !== 0) {
      setValue(initialValue)
      return
    }

    setLoading(true)

    if (fetchUrlValuePromises[url] === undefined) {
      fetchUrlValuePromises[url] = fetch(url).then((r) => r.json())
    }

    fetchUrlValuePromises[url]
      .then((v) => {
        cachedUrlValues[url] = v
        setValue(v)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [url])

  return [value, loading]
}
