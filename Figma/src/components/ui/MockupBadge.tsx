/**
 * The one badge every mockup surface on this page wears.
 *
 * WHY IT EXISTS: the owner dashboard now carries several *mockup* panels —
 * ID verification, the phone-camera room scan, amenity checkboxes. A judge or
 * a teammate must be able to tell at a glance which parts are real (sign-in,
 * publishing, status changes) and which are props. One component, one class,
 * no exceptions — if a panel is fake, it wears this.
 */
export default function MockupBadge({ label = "Mockup" }: { label?: string }) {
  return <span className="mockup-badge">{label}</span>
}
