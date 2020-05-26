export function getOrThrow<T>(value: T | undefined, message?: string): T {
  if (value) {
    return value
  }

  throw new Error(message || "Unexpected undefined value")
}

