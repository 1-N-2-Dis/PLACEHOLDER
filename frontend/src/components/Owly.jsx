// Owly — GuidHer mascot component. "Wise. Watchful. With you."
// Real illustrated poses supplied in GuidHer_Assets/, selected per context via the `pose` prop.
import welcome from '../../GuidHer_Assets/welcome.png';
import caution from '../../GuidHer_Assets/caution.png';
import cheering from '../../GuidHer_Assets/cheering.png';
import looksOut from '../../GuidHer_Assets/looks-out.png';
import onTheWay from '../../GuidHer_Assets/ontheway.png';
import otwLrt from '../../GuidHer_Assets/otwlrt.png';
import pointsTheWay from '../../GuidHer_Assets/pointstheway.png';
import protect from '../../GuidHer_Assets/protect.png';
import safelyArrived from '../../GuidHer_Assets/safelyarrived.png';
import shareAndHelp from '../../GuidHer_Assets/shareandhelp.png';
import walkingHome from '../../GuidHer_Assets/walkinghome.png';

const POSES = {
  welcome,
  caution,
  cheering,
  'looks-out': looksOut,
  ontheway: onTheWay,
  otwlrt: otwLrt,
  pointstheway: pointsTheWay,
  protect,
  safelyarrived: safelyArrived,
  shareandhelp: shareAndHelp,
  walkinghome: walkingHome,
};

export default function Owly({ size = 100, className = '', pose = 'welcome' }) {
  const src = POSES[pose] || welcome;
  return (
    <img
      src={src}
      width={size}
      height={size}
      className={className}
      alt="Owly, GuidHer safety companion"
      style={{ objectFit: 'contain' }}
    />
  );
}
