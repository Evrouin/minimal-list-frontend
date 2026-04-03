import type { LinkPreview } from '~/types/todo'

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/g

export const useLinkPreviews = () => {
  const api = useTodoApi()
  const fetching = ref(new Set<string>())
  const failed = new Set<string>()

  const extractUrls = (html: string): string[] => {
    const text = html.replace(/<[^>]*>/g, ' ')
    const matches = text.match(URL_REGEX) || []
    return [...new Set(matches)]
  }

  const fetchPreviews = async (body: string, existing: LinkPreview[]): Promise<LinkPreview[]> => {
    const urls = extractUrls(body)
    const existingUrls = new Set(existing.map((p) => p.url))
    const newUrls = urls.filter((u) => !existingUrls.has(u) && !failed.has(u) && !fetching.value.has(u))

    const updated = existing.filter((p) => urls.includes(p.url))

    const results = await Promise.allSettled(
      newUrls.map(async (url) => {
        fetching.value.add(url)
        try {
          return await api.fetchLinkPreview(url)
        } catch {
          failed.add(url)
          return null
        } finally {
          fetching.value.delete(url)
        }
      }),
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) updated.push(r.value)
    }

    return updated
  }

  const isLoading = computed(() => fetching.value.size > 0)

  return { extractUrls, fetchPreviews, isLoading }
}
