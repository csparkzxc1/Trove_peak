import { View, type ViewProps } from 'react-native';
import { COLORS } from '@/constants/theme';

export type DividerProps = ViewProps & {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed';
  color?: string;
};

export function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  color = COLORS.line,
  style,
  ...rest
}: DividerProps) {
  const horizontal = orientation === 'horizontal';
  return (
    <View
      {...rest}
      style={[
        horizontal
          ? { height: 0, borderBottomWidth: 1, borderColor: color, borderStyle: variant }
          : { width: 0, borderLeftWidth: 1, borderColor: color, borderStyle: variant },
        style,
      ]}
    />
  );
}
