const requestCache: Record<string, any> = {}
const requestPromises: Record<string, Promise<any>> = {}

export const cachedFetchJson = async (url: string) => {
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
