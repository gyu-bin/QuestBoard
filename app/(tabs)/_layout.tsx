import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { ScrollText, ShoppingBag, User } from 'lucide-react-native';
import { COLORS, RADIUS } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
          shadowColor: '#2D2A26',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: COLORS.text,
        },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          shadowColor: '#2D2A26',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
        tabBarItemStyle: { paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '퀘스트',
          headerShown: false,
          tabBarLabel: '퀘스트',
          tabBarIcon: ({ color, size }) => <ScrollText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: '상점',
          headerShown: false,
          tabBarLabel: '상점',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '프로필',
          headerShown: false,
          tabBarLabel: '프로필',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
