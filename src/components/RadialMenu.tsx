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

// Configurações dimensionais calibradas e compactas
const RADIUS = 100;          // Raio compacto na medida certa para não sobrepor o botão
const BUTTON_SIZE = 56;     // Botão principal
const ITEM_SIZE = 42;       // Botões filhos compactos
const ANGLE_STEP = 42;      // Espaçamento angular entre os botões (em graus)

export default function RadialMenu({ items }: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openProgress = useSharedValue(0);
  const rotationOffset = useSharedValue(0);
  const startRotation = useSharedValue(0);

  const maxScroll = Math.max(0, (items.length - 2) * ANGLE_STEP);

  // Animação rápida e direta (180ms para abrir, 140ms para fechar)
  const toggleMenu = () => {
    if (isOpen) {
      openProgress.value = withTiming(0, {
        duration: 140,
        easing: Easing.in(Easing.cubic),
      });
      rotationOffset.value = withTiming(0, { duration: 140 });
      setIsOpen(false);
    } else {
      setIsOpen(true);
      openProgress.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  // Gesto de rotação (Pan) com distância mínima para não capturar toques acidentais
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
      if (rotationOffset.value < 0) {
        rotationOffset.value = withTiming(0, { duration: 150 });
      } else if (rotationOffset.value > maxScroll) {
        rotationOffset.value = withTiming(maxScroll, { duration: 150 });
      }
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
      {/* Fundo que fecha ao clicar fora */}
      {isOpen && (
        <Pressable style={styles.backdrop} onPress={toggleMenu} />
      )}

      {/* Traçado da circunferência pontilhada */}
      {isOpen && (
        <Animated.View style={[styles.arcCircle, arcAnimatedStyle]} pointerEvents="none" />
      )}

      {/* Zona da Roleta: captura o arrasto em toda a área do arco sem fechar ao errar o ícone */}
      {isOpen && (
        <GestureDetector gesture={panGesture}>
          <View style={styles.dialZone}>
            {items.map((item, index) => (
              <RadialItemComponent
                key={item.id}
                item={item}
                index={index}
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

      {/* Botão Principal */}
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

function RadialItemComponent({
  item,
  index,
  openProgress,
  rotationOffset,
  onSelect,
}: {
  item: RadialMenuItem;
  index: number;
  openProgress: SharedValue<number>;
  rotationOffset: SharedValue<number>;
  onSelect: () => void;
}) {
  // Gesto nativo de Tap: garante que o clique execute mesmo com o Pan ativo
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onSelect)();
  });

  const animatedStyle = useAnimatedStyle(() => {
    const baseAngle = 16 + index * ANGLE_STEP;
    const currentAngle = baseAngle - rotationOffset.value;
    const rad = (currentAngle * Math.PI) / 180;

    const targetX = -RADIUS * Math.cos(rad);
    const targetY = -RADIUS * Math.sin(rad);

    const translateX = interpolate(openProgress.value, [0, 1], [0, targetX]);
    const translateY = interpolate(openProgress.value, [0, 1], [0, targetY]);

    const opacity =
      interpolate(
        currentAngle,
        [-10, 10, 85, 105],
        [0, 1, 1, 0],
        Extrapolation.CLAMP
      ) * openProgress.value;

    const scale =
      interpolate(
        currentAngle,
        [-10, 10, 85, 105],
        [0.5, 1, 1, 0.5],
        Extrapolation.CLAMP
      ) * openProgress.value;

    return {
      opacity,
      transform: [{ translateX }, { translateY }, { scale }],
    };
  });

  return (
    <Animated.View style={[styles.itemWrapper, animatedStyle]}>
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
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonAndLabelContainer: {
    position: 'absolute',
    right: 0,
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