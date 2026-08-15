import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabBar, TabItem } from '../components/AnimatedTabBar';
import { APP_CONFIG } from '../../domain/constants/appConfig';
import PlanningScreen from './PlanningScreen';
import WorkersScreen from './WorkersScreen';
import RoomsScreen from './RoomsScreen';
import SettingsScreen from './SettingsScreen';

const TABS: TabItem[] = [
  {
    key: 'planning',
    label: 'Planificación',
    icon: 'plus-circle-outline',
    activeColor: '#38BDF8',
    activeBgColor: 'rgba(56, 189, 248, 0.15)',
  },
  {
    key: 'workers',
    label: 'Trabajadores',
    icon: 'account-outline',
    activeColor: '#10B981',
    activeBgColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    key: 'rooms',
    label: 'Salas',
    icon: 'bed-outline',
    activeColor: '#EF4444',
    activeBgColor: 'rgba(239, 68, 68, 0.15)',
  },
  {
    key: 'settings',
    label: 'Configuración',
    icon: 'cog-outline',
    activeColor: '#A78BFA',
    activeBgColor: 'rgba(167, 139, 250, 0.15)',
  },
];

export default function HomeScreen() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const renderActiveScreen = () => {
    switch (activeTabIndex) {
      case 0:
        return <PlanningScreen />;
      case 1:
        return <WorkersScreen />;
      case 2:
        return <RoomsScreen />;
      case 3:
        return <SettingsScreen />;
      default:
        return <PlanningScreen />;
    }
  };

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      {/* Main Header Bar */}
      <View style={[styles.appHeader, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appBrand}>{APP_CONFIG.appName.toUpperCase()}</Text>
            <Text style={styles.appDate}>
              {today.charAt(0).toUpperCase() + today.slice(1)}
            </Text>
          </View>
          <View style={styles.badgeIVSS}>
            <Text style={styles.badgeIVSSText}>{APP_CONFIG.appBadge}</Text>
          </View>
        </View>
      </View>

      {/* Dynamic Screen View */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Gorhom Animated Tab Bar */}
      <AnimatedTabBar
        tabs={TABS}
        selectedIndex={activeTabIndex}
        onTabPress={setActiveTabIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  appHeader: {
    backgroundColor: '#0B1120',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBrand: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  appDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  badgeIVSS: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeIVSSText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  screenContainer: {
    flex: 1,
  },
});
