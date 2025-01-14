
export function getSocialImageUrl(pageId: string) {
  if (!pageId) return null
  try {
    const url = new URL("/api/social-image", window.location.origin)
    url.searchParams.set('id', pageId)
    return url.toString()
  } catch (err) {
    console.warn('error invalid social image url', pageId, err.message)
  }

  return null
}
