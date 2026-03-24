/** Message from RTK Query / fetchBaseQuery error after unwrap() */
export function rtkErrorMessage(e: unknown): string {
  if (typeof e === 'object' && e !== null && 'data' in e) {
    const d = (e as { data?: unknown }).data
    if (d && typeof d === 'object' && d !== null) {
      if ('message' in d && typeof (d as { message: unknown }).message === 'string') {
        return (d as { message: string }).message
      }
      if ('error' in d && typeof (d as { error: unknown }).error === 'string') {
        return (d as { error: string }).error
      }
    }
  }
  if (e instanceof Error) return e.message
  return 'Request failed'
}
