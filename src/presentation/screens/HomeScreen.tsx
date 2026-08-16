import React, { useMemo, useState } from 'react';
import { View, StyleSheet, StatusBar, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabBar, TabItem } from '../components/AnimatedTabBar';
import { APP_CONFIG } from '../../domain/constants/appConfig';
import { useAppTheme, ThemeColors } from '../theme/ThemeProvider';
import PlanningScreen from './PlanningScreen';
import WorkersScreen from './WorkersScreen';
import RoomsScreen from './RoomsScreen';
import SettingsScreen from './SettingsScreen';

function buildTabs(colors: ThemeColors): TabItem[] {
  return [
    {
      key: 'planning',
      label: 'Planificación',
      icon: 'plus-circle-outline',
      activeColor: colors.accent,
      activeBgColor: colors.accentTint,
    },
    {
      key: 'workers',
      label: 'Trabajadores',
      icon: 'account-outline',
      activeColor: colors.success,
      activeBgColor: colors.successTint,
    },
    {
      key: 'rooms',
      label: 'Salas',
      icon: 'bed-outline',
      activeColor: colors.danger,
      activeBgColor: colors.dangerTint,
    },
    {
      key: 'settings',
      label: 'Configuración',
      icon: 'cog-outline',
      activeColor: colors.purple,
      activeBgColor: colors.purpleTint,
    },
  ];
}

export default function HomeScreen() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const tabs = useMemo(() => buildTabs(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.header}
      />

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
        tabs={tabs}
        selectedIndex={activeTabIndex}
        onTabPress={setActiveTabIndex}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    appHeader: {
      backgroundColor: colors.header,
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    appBrand: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textStrong,
      letterSpacing: 0.5,
    },
    appDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    badgeIVSS: {
      backgroundColor: colors.accentTint,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeIVSSText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    screenContainer: {
      flex: 1,
    },
  });