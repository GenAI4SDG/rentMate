import type { ReactNode } from "react"
import Logo from "./Logo"
import Icon from "./Icon"

export default function Shell({
  children,
  progress,
}: {
  children: ReactNode
  progress?: number
}) {
  return (
    <main className="flow-shell">
      {progress !== undefined && (
        <div className="top-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      <header className="flow-header">
        <Logo />
        <div className="trust-note">
          <Icon name="lock" size={15} /> Private & secure
        </div>
      </header>
      {children}
    </main>
  )
}