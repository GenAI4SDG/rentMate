import Icon from "./Icon"

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <button
      className={`logo ${light ? "logo-light" : ""}`}
      onClick={() => window.location.reload()}
      aria-label="Rent Mate home"
    >
      <span className="logo-mark">
        <Icon name="home" size={18} strokeWidth={2.2} />
      </span>
      <span>rent mate</span>
    </button>
  )
}