import { ref, watch, type Ref } from 'vue';

/**
 * Ref mirrored into localStorage. Reads fall back to `fallback` when the key is
 * absent or unparseable, so a corrupted value never breaks a boot.
 */
export function useLocalStorage<T>(key: string, fallback: T): Ref<T> {
  const stored = ref(fallback) as Ref<T>;

  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) stored.value = JSON.parse(raw) as T;
  } catch {
    stored.value = fallback;
  }

  watch(
    stored,
    (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Private mode or a full quota: keeping the in-memory value is enough.
      }
    },
    { deep: true },
  );

  return stored;
}
