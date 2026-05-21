import Svg, { Path, Polyline } from 'react-native-svg';
import { COLORS } from '@/constants/theme';

export type MountainSvgProps = {
  size?: number;
  stroke?: string;
  variant?: 'simple' | 'twin';
};

export function MountainSvg({
  size = 80,
  stroke = COLORS.navy,
  variant = 'simple',
}: MountainSvgProps) {
  const width = size;
  const height = size * 0.55;
  if (variant === 'twin') {
    return (
      <Svg width={width} height={height} viewBox="0 0 100 55">
        <Polyline
          points="2,52 22,28 38,40 56,12 78,38 98,52"
          fill="none"
          stroke={stroke}
          strokeWidth={1.2}
          strokeLinejoin="miter"
        />
      </Svg>
    );
  }
  return (
    <Svg width={width} height={height} viewBox="0 0 100 55">
      <Path
        d="M2 52 L40 14 L62 36 L98 52"
        fill="none"
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinejoin="miter"
      />
    </Svg>
  );
}
