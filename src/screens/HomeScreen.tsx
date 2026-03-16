import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

const emergencies = [
  {
    type: 'police' as const,
    label: 'Police',
    subtitle: 'Threat · Crime · Danger',
    emoji: '🚔',
    color: '#3b82f6',
  },
  {
    type: 'medical' as const,
    label: 'Medical',
    subtitle: 'Injury · Illness · Cardiac',
    emoji: '🚑',
    color: '#ef4444',
  },
  {
    type: 'fire' as const,
    label: 'Fire',
    subtitle: 'Fire · Explosion · Rescue',
    emoji: '🔥',
    color: '#f97316',
  },
];

type EmergencyType = 'police' | 'medical' | 'fire';
type LocationStatus = 'loading' | 'ready' | 'denied' | 'unavailable';

const locationBadgeConfig: Record<
  LocationStatus,
  {text: string; dotColor: string; textColor: string; borderColor: string; bgColor: string; dotPulse: boolean}
> = {
  loading: {
    text: 'Getting location...',
    dotColor: '#facc15',
    textColor: '#facc15',
    borderColor: 'rgba(234,179,8,0.3)',
    bgColor: 'rgba(234,179,8,0.1)',
    dotPulse: true,
  },
  ready: {
    text: 'Location Ready',
    dotColor: '#34d399',
    textColor: '#34d399',
    borderColor: 'rgba(16,185,129,0.3)',
    bgColor: 'rgba(16,185,129,0.1)',
    dotPulse: true,
  },
  denied: {
    text: 'Location Off',
    dotColor: '#f87171',
    textColor: '#f87171',
    borderColor: 'rgba(239,68,68,0.3)',
    bgColor: 'rgba(239,68,68,0.1)',
    dotPulse: false,
  },
  unavailable: {
    text: 'No GPS',
    dotColor: 'rgba(255,255,255,0.3)',
    textColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(255,255,255,0.1)',
    bgColor: 'rgba(255,255,255,0.05)',
    dotPulse: false,
  },
};

interface HomeScreenProps {
  onSelect: (type: EmergencyType) => void;
  locationStatus?: LocationStatus;
  address?: string;
}

export default function HomeScreen({
  onSelect,
  locationStatus = 'loading',
  address = '',
}: HomeScreenProps) {
  // Fade/slide entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(16)).current;
  const buttonAnims = useRef(
    emergencies.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(24),
    })),
  ).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  // Ripple animation
  const rippleAnims = useRef(
    Array.from({length: 5}, () => new Animated.Value(0)),
  ).current;

  // Dot pulse animation for location badge
  const dotPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Status bar fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Header slide up
    Animated.parallel([
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 500,
        delay: 75,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered button animations
    buttonAnims.forEach((anim, idx) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 500,
          delay: 150 + idx * 80,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 500,
          delay: 150 + idx * 80,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Footer fade
    Animated.timing(footerFade, {
      toValue: 1,
      duration: 500,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Ripple loops
    rippleAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });

    // Dot pulse loop
    const badge = locationBadgeConfig[locationStatus];
    if (badge.dotPulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotPulse, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(dotPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [fadeAnim, headerSlide, buttonAnims, footerFade, rippleAnims, dotPulse, locationStatus]);

  const badge = locationBadgeConfig[locationStatus];

  return (
    <View style={styles.container}>
      {/* Status bar row */}
      <Animated.View style={[styles.statusRow, {opacity: fadeAnim}]}>
        {/* GPS badge */}
        <View>
          <View
            style={[
              styles.badge,
              {borderColor: badge.borderColor, backgroundColor: badge.bgColor},
            ]}>
            <Animated.View
              style={[
                styles.dot,
                {backgroundColor: badge.dotColor, opacity: dotPulse},
              ]}
            />
            <Text style={[styles.badgeText, {color: badge.textColor}]}>
              {badge.text}
            </Text>
          </View>
          {locationStatus === 'ready' && address ? (
            <Text style={styles.addressText} numberOfLines={1}>
              {address}
            </Text>
          ) : null}
          {locationStatus === 'denied' ? (
            <Text style={styles.deniedText}>
              Enable location for accurate dispatch
            </Text>
          ) : null}
        </View>

        {/* 24/7 pill */}
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>24/7 Active</Text>
        </View>
      </Animated.View>

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{translateY: headerSlide}],
          },
        ]}>
        <Text style={styles.title}>
          LIFE<Text style={styles.titleAccent}>SAVER</Text>
        </Text>
        <Text style={styles.subtitle}>Emergency Response System</Text>
        <View style={styles.divider} />
      </Animated.View>

      {/* CTA */}
      <Animated.View style={{opacity: fadeAnim}}>
        <Text style={styles.cta}>Select your emergency type</Text>
      </Animated.View>

      {/* Emergency buttons */}
      <View style={styles.buttonList}>
        {emergencies.map(({type, label, subtitle: sub, emoji, color}, idx) => (
          <Animated.View
            key={type}
            style={{
              opacity: buttonAnims[idx].opacity,
              transform: [{translateY: buttonAnims[idx].translateY}],
            }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onSelect(type)}
              style={[
                styles.emergencyButton,
                {
                  borderColor: `${color}30`,
                  shadowColor: color,
                  shadowOpacity: 0.25,
                  shadowRadius: 40,
                  shadowOffset: {width: 0, height: 0},
                  elevation: 8,
                },
              ]}>
              {/* Pulse layer */}
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  styles.pulseLayer,
                  {backgroundColor: `${color}20`},
                ]}
              />

              {/* Icon */}
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: `${color}18`,
                    borderColor: `${color}35`,
                  },
                ]}>
                <Text style={styles.iconEmoji}>{emoji}</Text>
              </View>

              {/* Text */}
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonLabel}>{label}</Text>
                <Text style={styles.buttonSubtitle}>{sub}</Text>
              </View>

              {/* Arrow */}
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Ripple background */}
      <View style={styles.rippleContainer} pointerEvents="none">
        {rippleAnims.map((anim, i) => {
          const size = 80 + i * 60;
          const baseOpacity = 0.15 - i * 0.035;
          return (
            <Animated.View
              key={i}
              style={[
                styles.rippleCircle,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderColor: '#ffffff',
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Math.max(0, baseOpacity), 0],
                  }),
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.8],
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Footer */}
      <Animated.View style={[styles.footer, {opacity: footerFade}]}>
        <Text style={styles.footerText}>TAP TO CONTACT EMERGENCY SERVICES</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 56,
  },
  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    paddingLeft: 4,
    marginTop: 2,
    maxWidth: 180,
  },
  deniedText: {
    fontSize: 10,
    color: 'rgba(248,113,113,0.6)',
    paddingLeft: 4,
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activePillText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  // Header
  header: {
    marginBottom: 40,
    zIndex: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#ffffff',
  },
  titleAccent: {
    color: '#ef4444',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  divider: {
    marginTop: 16,
    width: 64,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  // CTA
  cta: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
    zIndex: 10,
  },
  // Buttons
  buttonList: {
    gap: 12,
    zIndex: 10,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 96,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111111',
    overflow: 'hidden',
  },
  pulseLayer: {
    borderRadius: 16,
    opacity: 0.5,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconEmoji: {
    fontSize: 32,
  },
  buttonTextContainer: {
    flexShrink: 1,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  arrow: {
    marginLeft: 'auto',
    paddingRight: 4,
    fontSize: 24,
    color: 'rgba(255,255,255,0.25)',
  },
  // Ripple
  rippleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
  },
  rippleCircle: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
    alignItems: 'center',
    zIndex: 10,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
