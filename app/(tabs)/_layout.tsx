import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';

type TabBarLabelProps = { label: string; focused: boolean };

function TabLabel({ label, focused }: TabBarLabelProps) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 6 }}>
      <Text
        variant="mono"
        weight="medium"
        style={{
          fontSize: 10,
          letterSpacing: 2.2,
          color: focused ? COLORS.navy : COLORS.stone,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <View
        style={{
          marginTop: 6,
          height: 2,
          width: 18,
          backgroundColor: focused ? COLORS.gold : 'transparent',
        }}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: COLORS.cream,
          borderTopWidth: 1,
          borderTopColor: COLORS.line,
          height: 68,
          paddingTop: 4,
        },
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="도감" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="등록" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="프로필" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
