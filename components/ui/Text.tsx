import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { FONT } from '@/constants/theme';

type Variant = 'serifKr' | 'serifEn' | 'sans' | 'mono';
type Weight = 'regular' | 'medium' | 'bold' | 'italic';

export type TextProps = RNTextProps & {
  variant?: Variant;
  weight?: Weight;
};

const FAMILY: Record<Variant, Partial<Record<Weight, string>>> = {
  serifKr: {
    medium: FONT.serifKr,
    bold: FONT.serifKrBold,
    regular: FONT.serifKr,
  },
  serifEn: {
    medium: FONT.serifEn,
    italic: FONT.serifEnItalic,
    regular: FONT.serifEn,
  },
  sans: {
    regular: FONT.sans,
    medium: FONT.sansMedium,
  },
  mono: {
    regular: FONT.mono,
    medium: FONT.monoMedium,
  },
};

export function Text({
  variant = 'sans',
  weight = 'regular',
  style,
  ...rest
}: TextProps) {
  const family = FAMILY[variant][weight] ?? FAMILY[variant].regular ?? FONT.sans;
  return <RNText {...rest} style={[{ fontFamily: family, color: '#1A1A1A' }, style]} />;
}
