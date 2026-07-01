// BrandMark — GuidHer circular logo mark (small owl-face icon, distinct from the full Owly mascot).
import appIcon from '../../GuidHer_Assets/appicon.png';

export default function BrandMark({ size = 36, className = '' }) {
  return (
    <img
      src={appIcon}
      width={size}
      height={size}
      className={className}
      alt=""
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
