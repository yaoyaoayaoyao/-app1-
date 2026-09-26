import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { useThemeStore } from '@/stores/theme.store';

const TabConfig = [
  { name: 'index', title: '首页', icon: 'home-heart', focusedIcon: 'home-heart' },
  { name: 'checkin', title: '打卡', icon: 'check-circle-outline', focusedIcon: 'check-circle' },
  { name: 'food', title: '饮食', icon: 'silverware-fork-knife', focusedIcon: 'silverware-fork-knife' },
  { name: 'notes', title: '便签', icon: 'note-outline', focusedIcon: 'note' },
  { name: 'profile', title: '我的', icon: 'account-outline', focusedIcon: 'account-heart' },
] as const;

type TabBarProps = React.ComponentProps<typeof Tabs>['tabBar'];

function CinnamorollTabBar({ state, descriptors, navigation }: NonNullable<TabBarProps> extends (props: infer P) => React.ReactNode ? P : never) {
  const currentTheme = useThemeStore((s) => s.currentTheme);

  return (
    <View style={[styles.tabBar, { backgroundColor: currentTheme.surface, borderTopColor: currentTheme.border, shadowColor: currentTheme.shadowColor }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TabConfig[index];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isFocused ? config.focusedIcon : config.icon}
              size={26}
              color={isFocused ? currentTheme.primary : currentTheme.textHint}
            />
            <Text style={[styles.tabLabel, isFocused && { color: currentTheme.primary, fontWeight: '600' }]}>
              {config.title}
            </Text>
            {isFocused && <View style={[styles.tabIndicator, { backgroundColor: currentTheme.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CinnamorollTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: '首页' }} />
      <Tabs.Screen name="checkin" options={{ title: '打卡' }} />
      <Tabs.Screen name="food" options={{ title: '饮食' }} />
      <Tabs.Screen name="notes" options={{ title: '便签' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? spacing.xs : spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    position: 'relative',
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textHint,
    marginTop: 2,
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
