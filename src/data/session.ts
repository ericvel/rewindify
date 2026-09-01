import type { Session } from '@/auth/types'

/** The account the mock connects as. A real token exchange supplies this. */
export const MOCK_SESSION: Session = {
  displayName: 'Eric Veliyulin',
  product: 'premium',
}
