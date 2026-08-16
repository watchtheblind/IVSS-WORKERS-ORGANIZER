import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, ThemeColors } from '../theme/ThemeProvider';

export interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  activeColor: string;
  activeBgColor: string;
}

interface AnimatedTabBarProps {
  tabs: TabItem[];
  selectedIndex: number;
  onTabPress: (index: number) => void;
}

interface TabButtonProps {
  item: TabItem;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  inactiveColor: string;
}

const TabButton: React.FC<TabButtonProps> = ({
  item,
  isSelected,
  onPress,
  inactiveColor,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const animatedValue = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isSelected ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [isSelected, animatedValue]);

  // Interpolations for bubble expansion effect (Gorhom style)
  const flexGrow = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.3],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', item.activeBgColor],
  });

  const labelOpacity = animatedValue.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  const labelTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const iconScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.1],
  });

  return (
    <Animated.View style={[styles.tabButtonWrapper, { flex: flexGrow }]}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.bubbleContainer,
            { backgroundColor },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={isSelected ? item.activeColor : inactiveColor}
            />
          </Animated.View>

          {isSelected && (
            <Animated.View
              style={{
                opacity: labelOpacity,
                transform: [{ translateX: labelTranslateX }],
                marginLeft: 8,
              }}
            >
              <Text
                numberOfLines={1}
                style={[styles.tabLabel, { color: item.activeColor }]}
              >
                {item.label}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  tabs,
  selectedIndex,
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const bottomPadding = Math.max(insets.bottom, 12);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBarInner}>
        {tabs.map((tab, index) => (
          <TabButton
            key={tab.key}
            item={tab}
            index={index}
            isSelected={selectedIndex === index}
            onPress={() => onTabPress(index)}
            inactiveColor={colors.textFaint}
          />
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.header,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
      paddingHorizontal: 16,
    },
    tabBarInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    tabButtonWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    touchable: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderRadius: 20,
      minHeight: 44,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.1,
    },
  });