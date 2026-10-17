const EMAIL_KEY = "rentmate_demo_email"
const ONBOARDED_KEY = "rentmate_demo_onboarded"
const ROLE_KEY = "rentmate_user_role"
const LANDLORD_ID_KEY = "rentmate_landlord_id"
const DISPLAY_NAME_KEY = "rentmate_display_name"

export type UserRole = "tenant" | "landlord"

const STUDENT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.(edu\.hk|hk)$/i
const LANDLORD_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

export function isValidDemoEmail(email: string): boolean {
  return STUDENT_EMAIL_PATTERN.test(email.trim())
}

export function isValidLandlordEmail(email: string): boolean {
  return LANDLORD_EMAIL_PATTERN.test(email.trim())
}

export function getStoredEmail(): string {
  try {
    const value = localStorage.getItem(EMAIL_KEY)?.trim() ?? ""
    const role = getUserRole()
    if (role === "landlord") return isValidLandlordEmail(value) ? value : ""
    return isValidDemoEmail(value) ? value : ""
  } catch {
    return ""
  }
}

export function setStoredEmail(email: string): void {
  try {
    localStorage.setItem(EMAIL_KEY, email.trim())
  } catch {
    /* ignore */
  }
}

export function getUserRole(): UserRole | null {
  try {
    const r = localStorage.getItem(ROLE_KEY)
    return r === "landlord" || r === "tenant" ? r : null
  } catch {
    return null
  }
}

export function setUserRole(role: UserRole): void {
  try {
    localStorage.setItem(ROLE_KEY, role)
  } catch {
    /* ignore */
  }
}

export function getDisplayName(): string {
  try {
    return localStorage.getItem(DISPLAY_NAME_KEY)?.trim() ?? ""
  } catch {
    return ""
  }
}

export function setDisplayName(name: string): void {
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, name.trim())
  } catch {
    /* ignore */
  }
}

export function getLandlordId(): string {
  try {
    return localStorage.getItem(LANDLORD_ID_KEY)?.trim() ?? ""
  } catch {
    return ""
  }
}

export function setLandlordId(id: string): void {
  try {
    localStorage.setItem(LANDLORD_ID_KEY, id)
  } catch {
    /* ignore */
  }
}

export function isOnboarded(): boolean {
  try {
    if (getUserRole() === "landlord") {
      return Boolean(getStoredEmail()) && Boolean(getDisplayName())
    }
    return localStorage.getItem(ONBOARDED_KEY) === "1" && Boolean(getStoredEmail())
  } catch {
    return false
  }
}

export function setOnboardedComplete(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1")
  } catch {
    /* ignore */
  }
}

export function clearDemoSession(): void {
  try {
    localStorage.removeItem(EMAIL_KEY)
    localStorage.removeItem(ONBOARDED_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(LANDLORD_ID_KEY)
    localStorage.removeItem(DISPLAY_NAME_KEY)
  } catch {
    /* ignore */
  }
}

export async function resolveDemoLandlordId(): Promise<string | null> {
  const cached = getLandlordId()
  if (cached) return cached
  const fromEnv = import.meta.env.VITE_DEMO_LANDLORD_ID
  if (fromEnv) {
    setLandlordId(fromEnv)
    return fromEnv
  }
  try {
    const res = await fetch("/api/public/demo-landlord")
    if (!res.ok) return null
    const data = (await res.json()) as { id: string }
    setLandlordId(data.id)
    return data.id
  } catch {
    return null
  }
}
