const EMAIL_KEY = "rentmate_demo_email"
const ONBOARDED_KEY = "rentmate_demo_onboarded"
const ROLE_KEY = "rentmate_user_role"
const DISPLAY_NAME_KEY = "rentmate_display_name"
const QUIZ_KEY = "rentmate_quiz_answers"

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

/** Quiz answers (option index per question) — feeds the narrative & settling-in plan. */
export function getQuizAnswers(): number[] {
  try {
    const raw = localStorage.getItem(QUIZ_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : []
  } catch {
    return []
  }
}

export function setQuizAnswers(answers: number[]): void {
  try {
    localStorage.setItem(QUIZ_KEY, JSON.stringify(answers))
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
    localStorage.removeItem(DISPLAY_NAME_KEY)
    localStorage.removeItem(QUIZ_KEY)
  } catch {
    /* ignore */
  }
}
