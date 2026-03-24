/** Known users directory — for demo purposes */
export interface KnownUser {
  sub: string
  email: string
  name: string
}

export const USERS: KnownUser[] = [
  { sub: '0448b4b8-c071-703e-21a5-f08be6ef07e0', email: 'valery.satsura@startmatter.com', name: 'Valery Satsura' },
  { sub: '3428b418-f011-70c1-d3fb-73a759d4dd9d', email: 'ihar.ivanenko@startmatter.com', name: 'Ihar Ivanenko' },
  { sub: 'd498f478-8021-70b3-ba49-30a0b8ec4fb3', email: 'vitaly.belsky@startmatter.com', name: 'Vitaly Belsky' },
]

export function getUserName(sub: string): string {
  return USERS.find(u => u.sub === sub)?.name || sub.slice(0, 8)
}

export function getUserEmail(sub: string): string {
  return USERS.find(u => u.sub === sub)?.email || ''
}
