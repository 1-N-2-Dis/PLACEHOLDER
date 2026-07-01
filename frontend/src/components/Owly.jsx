// Owly — guidHER mascot SVG component.
// "Wise. Watchful. With you." — friendly purple owl.
// No emoji, lucide-react for all other icons (AGENTS.md rule).

export default function Owly({ size = 100, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Owly, guidHER safety companion"
      role="img"
    >
      {/* Body */}
      <ellipse cx="60" cy="72" rx="36" ry="38" fill="#7D5CC7"/>
      {/* Wings */}
      <ellipse cx="20" cy="80" rx="14" ry="22" fill="#4B2E83" transform="rotate(-15 20 80)"/>
      <ellipse cx="100" cy="80" rx="14" ry="22" fill="#4B2E83" transform="rotate(15 100 80)"/>
      {/* Head */}
      <circle cx="60" cy="44" r="30" fill="#9270E0"/>
      {/* Ear tufts */}
      <polygon points="40,18 34,4 48,14" fill="#4B2E83"/>
      <polygon points="80,18 86,4 72,14" fill="#4B2E83"/>
      {/* Face plate */}
      <ellipse cx="60" cy="48" rx="22" ry="20" fill="#FFF2E1"/>
      {/* Left eye */}
      <circle cx="50" cy="44" r="10" fill="#fff"/>
      <circle cx="50" cy="44" r="6" fill="#1A1033"/>
      <circle cx="52" cy="42" r="2" fill="#fff"/>
      <circle cx="53.5" cy="46" r="1" fill="#fff" opacity="0.6"/>
      {/* Right eye */}
      <circle cx="70" cy="44" r="10" fill="#fff"/>
      <circle cx="70" cy="44" r="6" fill="#1A1033"/>
      <circle cx="72" cy="42" r="2" fill="#fff"/>
      <circle cx="73.5" cy="46" r="1" fill="#fff" opacity="0.6"/>
      {/* Beak */}
      <polygon points="60,50 55,56 65,56" fill="#FFC857"/>
      {/* Chest pattern */}
      <ellipse cx="60" cy="78" rx="16" ry="20" fill="#B69AD9" opacity="0.5"/>
      {/* Feet */}
      <ellipse cx="50" cy="108" rx="8" ry="4" fill="#FFC857"/>
      <ellipse cx="70" cy="108" rx="8" ry="4" fill="#FFC857"/>
      {/* Pink accent blush */}
      <circle cx="44" cy="52" r="5" fill="#F28DBB" opacity="0.5"/>
      <circle cx="76" cy="52" r="5" fill="#F28DBB" opacity="0.5"/>
    </svg>
  );
}
