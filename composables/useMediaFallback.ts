export const useMediaFallback = () => {
  const config = useRuntimeConfig()
  const cdnUrl = config.public.cdnUrl as string
  const fallbackUrl = config.public.cdnFallbackUrl as string

  const onImageError = (e: Event) => {
    if (!cdnUrl || !fallbackUrl) return
    const img = e.target as HTMLImageElement
    if (img.src.includes(cdnUrl)) {
      img.src = img.src.replace(cdnUrl, fallbackUrl)
    }
  }

  return { onImageError }
}
