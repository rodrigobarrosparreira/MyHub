import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export interface RadialMenuItem {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface RadialMenuProps {
  items: RadialMenuItem[];
}

const RADIUS = 100;
const BUTTON_SIZE = 56;
const ITEM_SIZE = 42;
const ANGLE_STEP = 42;
const FIRST_ANGLE = 16;
const VISIBLE_MIN = 10;
const VISIBLE_MAX = 85;

export default function RadialMenu({ items }: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rotationStep, setRotationStep] = useState(0);

  const openProgress = useSharedValue(0);
  const rotationOffset = useSharedValue(0);
  const startRotation = useSharedValue(0);

  const maxSteps = Math.max(0, items.length - 2);
  const maxScroll = maxSteps * ANGLE_STEP;

  const toggleMenu = () => {
    if (isOpen) {
      openProgress.value = withTiming(0, {
        duration: 140,
        easing: Easing.in(Easing.cubic),
      });
      rotationOffset.value = withTiming(0, { duration: 140 });
      setRotationStep(0);
      setIsOpen(false);
    } else {
      setIsOpen(true);
      openProgress.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  const panGesture = Gesture.Pan()
    .minDistance(12)
    .onStart(() => {
      startRotation.value = rotationOffset.value;
    })
    .onUpdate((event) => {
      const delta = (event.translationY - event.translationX) * 0.25;
      const nextAngle = startRotation.value + delta;

      if (nextAngle >= -10 && nextAngle <= maxScroll + 10) {
        rotationOffset.value = nextAngle;
      }
    })
    .onEnd(() => {
      const step = Math.min(Math.max(Math.round(rotationOffset.value / ANGLE_STEP), 0), maxSteps);
      rotationOffset.value = withTiming(step * ANGLE_STEP, { duration: 150 });
      runOnJS(setRotationStep)(step);
    });

  const fabAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(openProgress.value, [0, 1], [0, 90]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const arcAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: openProgress.value * 0.4,
      transform: [{ scale: interpolate(openProgress.value, [0, 1], [0.85, 1]) }],
    };
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {isOpen && (
        <Pressable style={styles.backdrop} onPress={toggleMenu} />
      )}

      {isOpen && (
        <Animated.View style={[styles.arcCircle, arcAnimatedStyle]} pointerEvents="none" />
      )}

      {isOpen && (
        <GestureDetector gesture={panGesture}>
          <View style={styles.dialZone}>
            {items.map((item, index) => (
              <RadialItemComponent
                key={item.id}
                item={item}
                index={index}
                tappable={isAngleVisible(FIRST_ANGLE + (index - rotationStep) * ANGLE_STEP)}
                openProgress={openProgress}
                rotationOffset={rotationOffset}
                onSelect={() => {
                  toggleMenu();
                  item.onPress();
                }}
              />
            ))}
          </View>
        </GestureDetector>
      )}

      <Pressable style={styles.fabButton} onPress={toggleMenu}>
        <Animated.View style={fabAnimatedStyle}>
          <Ionicons
            name={isOpen ? 'close' : 'apps-outline'}
            size={26}
            color="#FFFFFF"
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

function isAngleVisible(angle: number) {
  return angle >= VISIBLE_MIN && angle <= VISIBLE_MAX;
}

function RadialItemComponent({
  item,
  index,
  tappable,
  openProgress,
  rotationOffset,
  onSelect,
}: {
  item: RadialMenuItem;
  index: number;
  tappable: boolean;
  openProgress: SharedValue<number>;
  rotationOffset: SharedValue<number>;
  onSelect: () => void;
}) {
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onSelect)();
  });

  const animatedStyle = useAnimatedStyle(() => {
    const baseAngle = FIRST_ANGLE + index * ANGLE_STEP;
    const currentAngle = baseAngle - rotationOffset.value;
    const rad = (currentAngle * Math.PI) / 180;

    const targetX = -RADIUS * Math.cos(rad);
    const targetY = -RADIUS * Math.sin(rad);

    const translateX = interpolate(openProgress.value, [0, 1], [0, targetX]);
    const translateY = interpolate(openProgress.value, [0, 1], [0, targetY]);

    const opacity =
      interpolate(
        currentAngle,
        [VISIBLE_MIN - 20, VISIBLE_MIN, VISIBLE_MAX, VISIBLE_MAX + 20],
        [0, 1, 1, 0],
        Extrapolation.CLAMP
      ) * openProgress.value;

    const scale =
      interpolate(
        currentAngle,
        [VISIBLE_MIN - 20, VISIBLE_MIN, VISIBLE_MAX, VISIBLE_MAX + 20],
        [0.5, 1, 1, 0.5],
        Extrapolation.CLAMP
      ) * openProgress.value;

    return {
      opacity,
      transform: [{ translateX }, { translateY }, { scale }],
    };
  });

  return (
    <Animated.View
      style={[styles.itemWrapper, animatedStyle]}
      pointerEvents={tappable ? 'auto' : 'none'}
    >
      <GestureDetector gesture={tapGesture}>
        <View style={styles.buttonAndLabelContainer}>
          <View style={styles.labelBadge}>
            <Text style={styles.itemLabel}>
              {item.name}
            </Text>
          </View>
          <View style={styles.itemButton}>
            <Ionicons name={item.icon} size={20} color="#FFFFFF" />
          </View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  arcCircle: {
    position: 'absolute',
    right: 28 + BUTTON_SIZE / 2 - RADIUS,
    bottom: 36 + BUTTON_SIZE / 2 - RADIUS,
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
  },
  dialZone: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: RADIUS + BUTTON_SIZE + 130,
    height: RADIUS + BUTTON_SIZE + 110,
    backgroundColor: 'transparent',
  },
  fabButton: {
    position: 'absolute',
    right: 28,
    bottom: 36,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  itemWrapper: {
    position: 'absolute',
    right: 28 + BUTTON_SIZE / 2 - ITEM_SIZE / 2,
    bottom: 36 + BUTTON_SIZE / 2 - ITEM_SIZE / 2,
  },
  buttonAndLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    flexShrink: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  itemButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  itemLabel: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
});