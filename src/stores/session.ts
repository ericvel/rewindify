import { computed } from 'vue'
import { defineStore } from 'pinia'
import { createMockAuthSource } from '@/auth/mockAuthSource'

export const useSessionStore = defineStore('session', () => {
  const source = createMockAuthSource()

  const session = computed(() => source.session.value)
  const isConnected = computed(() => session.value !== null)

  /** Uppercased for the mono header slot, where a long name is clipped. */
  const displayName = computed(() => session.value?.displayName.toUpperCase() ?? '')

  async function connect() {
    await source.connect()
  }

  async function disconnect() {
    await source.disconnect()
  }

  return { session, isConnected, displayName, connect, disconnect }
})
