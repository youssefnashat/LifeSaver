import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import {emergencyConfig, generateDispatchPhrase} from '../emergencyQuizLogic';
import {getBodySummary} from '../components/BodySelector';

const BACKEND_URL = 'http://localhost:4000';

const TYPE_MAP: Record<string, string> = {
  police: 'police',
  medical: 'ems',
  fire: 'fire',
};

const statusSteps = [
  'Connecting...',
  'Reaching dispatch...',
  'Line secured',
  'Connected',
];

type EmergencyType = 'police' | 'medical' | 'fire';

interface CallingScreenProps {
  type: EmergencyType;
  answers: Record<string, any>;
  address: string;
  coords: {latitude: number; longitude: number} | null;
  onConfirm: () => void;
  onBack: () => void;
}

export default function CallingScreen({
  type,
  answers,
  address,
  coords,
  onConfirm,
  onBack,
}: CallingScreenProps) {
  const config = (emergencyConfig as any)[type];
  const {bodySelections, ...quizAnswers} = answers;
  const basePhrase = generateDispatchPhrase(type, quizAnswers);
  const bodySummary = getBodySummary(bodySelections);
  const phrase = bodySummary ? `${basePhrase} ${bodySummary}` : basePhrase;

  const [statusIdx, setStatusIdx] = useState(0);
  const [showPhrase, setShowPhrase] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'pending' | 'success' | 'error'>('pending');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const numberSlide = useRef(new Animated.Value(16)).current;
  const iconScale = useRef(new Animated.Value(0.75)).current;
  const phraseSlide = useRef(new Animated.Value(24)).current;
  const phraseOpacity = useRef(new Animated.Value(0)).current;
  const phoneRing = useRef(new Animated.Value(0)).current;
  const pingAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Ripple animations
  const rippleAnims = useRef(
    Array.from({length: 6}, () => new Animated.Value(0)),
  ).current;

  // Entrance animations
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(numberSlide, {
      toValue: 0,
      duration: 500,
      delay: 100,
      useNativeDriver: true,
    }).start();

    Animated.timing(iconScale, {
      toValue: 1,
      duration: 500,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Ripple loops
    rippleAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
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

    // Phone ring animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(phoneRing, {
          toValue: 1,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(phoneRing, {
          toValue: -1,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(phoneRing, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    ).start();

    // Ping animation (connecting dot)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 0,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Pulse animation (connected dot)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim, numberSlide, iconScale, rippleAnims, phoneRing, pingAnim, pulseAnim]);

  // Status step progression
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx(prev => {
        if (prev < statusSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Show dispatch phrase after step 2
  useEffect(() => {
    if (statusIdx >= 2) {
      const t = setTimeout(() => {
        setShowPhrase(true);
        Animated.parallel([
          Animated.timing(phraseOpacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(phraseSlide, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]).start();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [statusIdx, phraseOpacity, phraseSlide]);

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Backend API call
  useEffect(() => {
    const resolvedAddress =
      address ||
      (coords
        ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
        : 'Unknown location');

    fetch(`${BACKEND_URL}/api/call`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        type: TYPE_MAP[type] || type,
        address: resolvedAddress,
        situation: phrase,
      }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Call failed');
        }
        return res.json();
      })
      .then(() => setCallStatus('success'))
      .catch(() => setCallStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isConnected = statusIdx === statusSteps.length - 1;

  return (
    <View style={styles.screen}>
      {/* Ripple bg */}
      <View style={styles.rippleContainer} pointerEvents="none">
        {rippleAnims.map((anim, i) => {
          const size = 120 + i * 60;
          const baseOpacity = (isConnected ? 0.2 : 0.12) - i * 0.025;
          return (
            <Animated.View
              key={i}
              style={[
                styles.rippleCircle,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderColor: config.color,
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Math.max(0, baseOpacity), 0],
                  }),
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Back */}
        <View style={styles.backRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Service label pill */}
        <Animated.View
          style={[
            styles.servicePill,
            {
              backgroundColor: `${config.color}15`,
              borderColor: `${config.color}30`,
              opacity: fadeAnim,
            },
          ]}>
          <Text style={styles.servicePillEmoji}>{config.emoji}</Text>
          <Text style={styles.servicePillLabel}>
            {config.label.toUpperCase()}
          </Text>
        </Animated.View>

        {/* Call number */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{translateY: numberSlide}],
            marginBottom: 12,
          }}>
          <Text style={styles.callNumber}>{config.callNumber}</Text>
        </Animated.View>

        {/* Status / duration */}
        <Animated.View style={[styles.statusRow, {opacity: fadeAnim}]}>
          {isConnected ? (
            <View style={styles.statusInner}>
              <Animated.View
                style={[
                  styles.statusDotConnected,
                  {backgroundColor: config.color, opacity: pulseAnim},
                ]}
              />
              <Text style={[styles.statusTextConnected, {color: config.color}]}>
                {formatDuration(callDuration)}
              </Text>
            </View>
          ) : (
            <View style={styles.statusInner}>
              <Animated.View
                style={[styles.statusDotPing, {opacity: pingAnim}]}
              />
              <Text style={styles.statusTextPending}>
                {statusSteps[statusIdx]}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Phone icon */}
        <Animated.View
          style={[
            styles.phoneCircle,
            {
              borderColor: `${config.color}40`,
              backgroundColor: `${config.color}15`,
              opacity: fadeAnim,
              transform: [{scale: iconScale}],
              shadowColor: config.color,
              shadowOpacity: isConnected ? 0.5 : 0.3,
              shadowRadius: isConnected ? 40 : 20,
              shadowOffset: {width: 0, height: 0},
              elevation: isConnected ? 12 : 6,
            },
          ]}>
          <Animated.Text
            style={[
              styles.phoneEmoji,
              {
                transform: [
                  {
                    rotate: isConnected
                      ? '0deg'
                      : phoneRing.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: ['-8deg', '0deg', '8deg'],
                        }),
                  },
                ],
              },
            ]}>
            📞
          </Animated.Text>
        </Animated.View>

        {/* Address */}
        {address ? (
          <Animated.View style={[styles.addressRow, {opacity: fadeAnim}]}>
            <Text style={styles.addressPin}>📍</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {address}
            </Text>
          </Animated.View>
        ) : null}

        {/* Dispatch phrase */}
        <Animated.View
          style={[
            styles.phraseCard,
            {
              backgroundColor: `${config.color}08`,
              borderColor: `${config.color}25`,
              opacity: phraseOpacity,
              transform: [{translateY: phraseSlide}],
            },
          ]}>
          <View style={styles.phraseHeader}>
            <View style={[styles.aiBadge, {backgroundColor: config.color}]}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
            <Text style={[styles.phraseLabel, {color: config.color}]}>
              DISPATCH MESSAGE
            </Text>
          </View>
          <Text style={styles.phraseText}>{phrase}</Text>
        </Animated.View>

        {/* Confirm / error */}
        {callStatus === 'error' ? (
          <Animated.View
            style={[
              styles.errorCard,
              {
                opacity: phraseOpacity,
                transform: [{translateY: phraseSlide}],
              },
            ]}>
            <Text style={styles.errorText}>
              Call failed. Please dial 911 directly.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            style={{
              opacity: phraseOpacity,
              transform: [{translateY: phraseSlide}],
              width: '100%',
            }}>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={callStatus !== 'success'}
              activeOpacity={0.8}
              style={[
                styles.confirmButton,
                {
                  backgroundColor: config.color,
                  opacity: callStatus !== 'success' ? 0.5 : 1,
                  shadowColor: config.color,
                  shadowOpacity: 0.4,
                  shadowRadius: 32,
                  shadowOffset: {width: 0, height: 8},
                  elevation: callStatus === 'success' ? 8 : 0,
                },
              ]}>
              <Text style={styles.confirmText}>
                {callStatus === 'pending' ? 'Placing call...' : 'Help Is Coming →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Text style={styles.footerText}>
          Stay on the line. Do not hang up.
        </Text>
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
  // Ripple
  rippleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  rippleCircle: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  // Content
  content: {
    flex: 1,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 32,
  },
  // Back
  backRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  backText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  // Service pill
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  servicePillEmoji: {
    fontSize: 16,
  },
  servicePillLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#ffffff',
  },
  // Call number
  callNumber: {
    fontSize: 60,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#ffffff',
  },
  // Status
  statusRow: {
    marginBottom: 48,
  },
  statusInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDotConnected: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTextConnected: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusDotPing: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  statusTextPending: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  // Phone icon
  phoneCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  phoneEmoji: {
    fontSize: 48,
  },
  // Address
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  addressPin: {
    fontSize: 12,
  },
  addressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  // Dispatch phrase
  phraseCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  phraseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  phraseLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  phraseText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.8)',
  },
  // Error
  errorCard: {
    width: '100%',
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#f87171',
  },
  // Confirm button
  confirmButton: {
    width: '100%',
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#ffffff',
  },
  // Footer
  footerText: {
    marginTop: 16,
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
  },
});
