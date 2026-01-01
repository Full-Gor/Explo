import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import {
  HomeScreen,
  FolderScreen,
  RecentScreen,
  FileDetailScreen,
  SettingsScreen,
} from '../screens';
import { colors, borderRadius } from '../theme/colors';
import { FileItem } from '../types';

// Types de navigation
export type RootStackParamList = {
  MainTabs: undefined;
  Folder: { folderId: string; folderName: string; path: string };
  FileDetail: { file: FileItem };
};

export type TabParamList = {
  Home: undefined;
  Recent: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
      <Feather
        name={name as any}
        size={22}
        color={focused ? colors.accentGradientStart : colors.textMuted}
      />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.accentGradientStart,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Fichiers',
          tabBarIcon: ({ focused }) => <TabBarIcon name="folder" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Recent"
        component={RecentScreen}
        options={{
          tabBarLabel: 'Récents',
          tabBarIcon: ({ focused }) => <TabBarIcon name="clock" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Paramètres',
          tabBarIcon: ({ focused }) => <TabBarIcon name="settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Folder" component={FolderScreen} />
        <Stack.Screen name="FileDetail" component={FileDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    height: 65,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    borderTopWidth: 0,
    paddingBottom: 6,
    paddingTop: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
  },
});
