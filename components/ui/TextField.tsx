import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';
import { MonoLabel } from './MonoLabel';
import { COLORS } from '@/constants/theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  errorText?: string;
};

export function TextField({
  label,
  errorText,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errorText);
  const borderColor = hasError ? '#9C3A2E' : focused ? COLORS.navy : COLORS.line;
  return (
    <View style={{ marginBottom: 18 }}>
      <MonoLabel tone={hasError ? 'gold' : 'stone'} style={{ marginBottom: 8 }}>
        {label}
      </MonoLabel>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      >
        <TextInput
          {...rest}
          placeholderTextColor={COLORS.stoneLight}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              fontFamily: 'Pretendard-Regular',
              fontSize: 16,
              color: COLORS.ink,
              paddingVertical: 10,
              paddingHorizontal: 0,
            },
            style,
          ]}
        />
      </View>
      {hasError ? (
        <Text variant="sans" style={{ marginTop: 6, fontSize: 12, color: '#9C3A2E' }}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
