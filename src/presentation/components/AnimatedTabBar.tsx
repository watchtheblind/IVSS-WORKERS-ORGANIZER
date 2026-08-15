import React, { useEffect, useRef } from 'react';
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
}

const TabButton: React.FC<TabButtonProps> = ({ item, isSelected, onPress }) => {
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
              color={isSelected ? item.activeColor : '#64748B'}
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
  const bottomPadding = Math.max(insets.bottom, 12);

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
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1120',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    minHeight: 46,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
