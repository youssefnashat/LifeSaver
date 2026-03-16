import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {emergencyConfig} from '../emergencyQuizLogic';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type EmergencyType = 'police' | 'medical' | 'fire';

interface ConfirmScreenProps {
  type: EmergencyType;
  onHome: () => void;
}

const tips = [
  'Stay calm and stay where you are',
  'Keep your phone accessible',
  'Move away from immediate danger if safe',
  'Help is on the way to your location',
];

export default function ConfirmScreen({type, onHome}: ConfirmScreenProps) {
  const config = (emergencyConfig as any)[type];
  const [phase, setPhase] = useState(0);

  // Phase animations
  const circleScale = useRef(new Animated.Value(0.5)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const checkDash = useRef(new Animated.Value(100)).current;
  const headingOpacity = useRef(new Animated.Value(0)).current;
  const headingSlide = useRef(new Animated.Value(16)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subSlide = useRef(new Animated.Value(12)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const tipsOpacity = useRef(new Animated.Value(0)).current;
  const tipsSlide = useRef(new Animated.Value(12)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Pulse ring animations
  const pulseAnims = useRef(
    [1, 2, 3].map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0),
    })),
  ).current;

  // Badge dot pulse
  const dotPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Phase 1: Circle appears
  useEffect(() => {
    if (phase >= 1) {
      Animated.parallel([
        Animated.spring(circleScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(circleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase, circleScale, circleOpacity]);

  // Phase 2: Checkmark draws, heading appears, pulse rings start
  useEffect(() => {
    if (phase >= 2) {
      // Checkmark stroke
      Animated.timing(checkDash, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }).start();

      // Heading
      Animated.parallel([
        Animated.timing(headingOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(headingSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse rings
      pulseAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 400),
            Animated.parallel([
              Animated.timing(anim.scale, {
                toValue: 1.6,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(anim.scale, {
                toValue: 1,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 0.15 / (i + 1),
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ).start();
      });
    }
  }, [phase, checkDash, headingOpacity, headingSlide, pulseAnims]);

  // Phase 3: Subtext + badge
  useEffect(() => {
    if (phase >= 3) {
      Animated.parallel([
        Animated.timing(subOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(subSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Badge dot pulse
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
  }, [phase, subOpacity, subSlide, badgeOpacity, dotPulse]);

  // Phase 4: Tips + buttons
  useEffect(() => {
    if (phase >= 4) {
      Animated.parallel([
        Animated.timing(tipsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(tipsSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase, tipsOpacity, tipsSlide, buttonOpacity]);

  return (
    <View style={styles.screen}>
      {/* Pulse rings */}
      <View style={styles.pulseContainer} pointerEvents="none">
        {pulseAnims.map((anim, i) => {
          const size = 100 + (i + 1) * 70;
          return (
            <Animated.View
              key={i}
              style={[
                styles.pulseRing,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderColor: config.color,
                  opacity: anim.opacity,
                  transform: [{scale: anim.scale}],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Checkmark circle */}
        <Animated.View
          style={[
            styles.checkCircle,
            {
              backgroundColor: phase >= 1 ? `${config.color}20` : 'transparent',
              borderColor: phase >= 1 ? config.color : 'transparent',
              opacity: circleOpacity,
              transform: [{scale: circleScale}],
              shadowColor: phase >= 2 ? config.color : 'transparent',
              shadowOpacity: phase >= 2 ? 0.4 : 0,
              shadowRadius: 60,
              shadowOffset: {width: 0, height: 0},
              elevation: phase >= 2 ? 12 : 0,
            },
          ]}>
          <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
            <AnimatedPath
              d="M12 28L22 38L44 18"
              stroke={config.color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={100}
              strokeDashoffset={checkDash}
            />
          </Svg>
        </Animated.View>

        {/* Main message */}
        <Animated.View
          style={{
            opacity: headingOpacity,
            transform: [{translateY: headingSlide}],
            marginBottom: 8,
            alignItems: 'center',
          }}>
          <Text style={styles.heading}>Help is coming</Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: subOpacity,
            transform: [{translateY: subSlide}],
            marginBottom: 40,
            alignItems: 'center',
          }}>
          <Text style={styles.subText}>
            {config.label} services have been notified
          </Text>
          <Text style={styles.subTextLight}>
            Stay on the line with the dispatcher
          </Text>
        </Animated.View>

        {/* Service badge */}
        <Animated.View
          style={[
            styles.serviceBadge,
            {
              backgroundColor: `${config.color}15`,
              borderColor: `${config.color}30`,
              opacity: badgeOpacity,
            },
          ]}>
          <Text style={styles.serviceBadgeEmoji}>{config.emoji}</Text>
          <Text style={styles.serviceBadgeLabel}>
            {config.label} Dispatch Notified
          </Text>
          <Animated.View
            style={[
              styles.serviceBadgeDot,
              {backgroundColor: config.color, opacity: dotPulse},
            ]}
          />
        </Animated.View>

        {/* Safety tips */}
        <Animated.View
          style={[
            styles.tipsCard,
            {
              opacity: tipsOpacity,
              transform: [{translateY: tipsSlide}],
            },
          ]}>
          <Text style={styles.tipsTitle}>WHILE YOU WAIT</Text>
          <View style={styles.tipsList}>
            {tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View
                  style={[styles.tipDot, {backgroundColor: config.color}]}
                />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Emergency info bar */}
        <Animated.View style={[styles.emergencyBar, {opacity: tipsOpacity}]}>
          <View>
            <Text style={styles.emergencyLabel}>Emergency line</Text>
            <Text style={styles.emergencyNumber}>{config.callNumber}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.callAgainButton,
              {
                backgroundColor: `${config.color}25`,
                borderColor: `${config.color}40`,
              },
            ]}>
            <Text style={styles.callAgainEmoji}>📞</Text>
            <Text style={styles.callAgainText}>Call Again</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Home button */}
        <Animated.View style={{opacity: buttonOpacity, width: '100%'}}>
          <TouchableOpacity
            onPress={onHome}
            activeOpacity={0.8}
            style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
  },
  // Pulse rings
  pulseContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  // Content
  content: {
    flex: 1,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
  // Checkmark
  checkCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  // Text
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  subTextLight: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 4,
  },
  // Service badge
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 32,
  },
  serviceBadgeEmoji: {
    fontSize: 20,
  },
  serviceBadgeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  serviceBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  // Safety tips
  tipsCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  tipsList: {
    gap: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    flexShrink: 1,
  },
  // Emergency bar
  emergencyBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 32,
  },
  emergencyLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
  emergencyNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  callAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  callAgainEmoji: {
    fontSize: 14,
  },
  callAgainText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  // Home button
  homeButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
});
