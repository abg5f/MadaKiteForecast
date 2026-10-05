"use client"

import { useCallback, useSyncExternalStore } from "react"

// Per-device preferences in localStorage (rider weight, preferred view).
const listeners = new Set<() => void>()

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function usePref<T extends string | number>(key: string, fallback: T, parse: (raw: string) => T | null): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const raw = read(key)
      return raw == null ? fallback : (parse(raw) ?? fallback)
    },
    () => fallback,
  )
  const set = useCallback(
    (v: T) => {
      try {
        localStorage.setItem(key, String(v))
      } catch {
        /* storage unavailable: value just won't persist */
      }
      listeners.forEach((l) => l())
    },
    [key],
  )
  return [value, set]
}
