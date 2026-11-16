export function CrystalLogo({ size = 72, className = "" }) {
  return (
    <div className={`crystal-logo ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" role="img" aria-label="DAXRONE crystal">
        <polygon points="80,12 119,57 80,148 41,57" fill="#303640" stroke="#AEB5C0" strokeWidth="1.6"/>
        <polygon points="80,12 80,148 41,57" fill="#737C89" opacity=".32"/>
        <polygon points="80,12 119,57 80,76" fill="#D0D4DA" opacity=".52"/>
        <polygon points="80,76 119,57 80,148" fill="#11151B" opacity=".85"/>
        <polygon points="80,12 41,57 80,76" fill="#8D96A3" opacity=".36"/>
        <ellipse className="crystal-orbit" cx="80" cy="80" rx="72" ry="27" fill="none" stroke="#AEB5C0" strokeWidth="2.2"/>
      </svg>
    </div>
  );
}

export function OrbitalLoader({ small = false }) {
  return (
    <span className={`orbital-loader ${small ? "small" : ""}`} aria-label="DAXRONE is thinking">
      <span className="orbital-core"><i /></span>
      <span className="orbital-ring" />
    </span>
  );
}
