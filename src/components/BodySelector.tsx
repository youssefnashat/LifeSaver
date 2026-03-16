import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import Svg, {Ellipse, Rect} from 'react-native-svg';

// ── Severity definitions ──
const SEVERITIES = [
  {id: 'bleeding', icon: '🩸'},
  {id: 'broken', icon: '🦴'},
  {id: 'burn', icon: '🔥'},
  {id: 'pain', icon: '🤕'},
];

// ── Body zone definitions (viewBox 0 0 200 380) ──
// "left" = figure's left = viewer's right side of screen
const ZONES = [
  {id: 'head', shape: 'ellipse' as const, props: {cx: 100, cy: 40, rx: 26, ry: 28}},
  {id: 'neck', shape: 'rect' as const, props: {x: 90, y: 67, width: 20, height: 18, rx: 5}},
  {id: 'chest', shape: 'rect' as const, props: {x: 55, y: 85, width: 90, height: 78, rx: 6}},
  {id: 'abdomen', shape: 'rect' as const, props: {x: 58, y: 163, width: 84, height: 50, rx: 6}},
  {id: 'leftArm', shape: 'rect' as const, props: {x: 145, y: 85, width: 30, height: 100, rx: 8}},
  {id: 'rightArm', shape: 'rect' as const, props: {x: 25, y: 85, width: 30, height: 100, rx: 8}},
  {id: 'leftHand', shape: 'ellipse' as const, props: {cx: 160, cy: 200, rx: 16, ry: 18}},
  {id: 'rightHand', shape: 'ellipse' as const, props: {cx: 40, cy: 200, rx: 16, ry: 18}},
  {id: 'leftLeg', shape: 'rect' as const, props: {x: 100, y: 213, width: 44, height: 130, rx: 8}},
  {id: 'rightLeg', shape: 'rect' as const, props: {x: 56, y: 213, width: 44, height: 130, rx: 8}},
  {id: 'leftFoot', shape: 'ellipse' as const, props: {cx: 122, cy: 357, rx: 24, ry: 15}},
  {id: 'rightFoot', shape: 'ellipse' as const, props: {cx: 78, cy: 357, rx: 24, ry: 15}},
];

// ── Zone display info ──
const ZONE_DISPLAY: Record<string, {emoji: string; label: string}> = {
  head: {emoji: '🧠', label: 'Head'},
  neck: {emoji: '🩹', label: 'Neck'},
  chest: {emoji: '🫀', label: 'Chest'},
  abdomen: {emoji: '🫁', label: 'Stomach'},
  leftArm: {emoji: '💪', label: 'Left Arm'},
  rightArm: {emoji: '💪', label: 'Right Arm'},
  leftHand: {emoji: '✋', label: 'Left Hand'},
  rightHand: {emoji: '🤚', label: 'Right Hand'},
  leftLeg: {emoji: '🦵', label: 'Left Leg'},
  rightLeg: {emoji: '🦵', label: 'Right Leg'},
  leftFoot: {emoji: '🦶', label: 'Left Foot'},
  rightFoot: {emoji: '🦶', label: 'Right Foot'},
};

// ── Summary utility ──
const ZONE_LABELS: Record<string, string> = {
  head: 'the head',
  neck: 'the neck',
  chest: 'the chest',
  abdomen: 'the abdomen',
  leftArm: 'the left arm',
  rightArm: 'the right arm',
  leftHand: 'the left hand',
  rightHand: 'the right hand',
  leftLeg: 'the left leg',
  rightLeg: 'the right leg',
  leftFoot: 'the left foot',
  rightFoot: 'the right foot',
};
const SEV_LABELS: Record<string, string> = {
  bleeding: 'bleeding',
  broken: 'a broken bone',
  burn: 'a burn',
  pain: 'pain',
};

export function getBodySummary(
  selections: Record<string, string[]> | undefined,
): string {
  if (!selections || !Object.keys(selections).length) {
    return '';
  }
  const parts = Object.entries(selections)
    .filter(([, sevs]) => sevs.length > 0)
    .map(([zone, sevs]) => {
      const loc = ZONE_LABELS[zone] || zone;
      const issues = sevs.map(s => SEV_LABELS[s] || s);
      const issueStr =
        issues.length === 1
          ? issues[0]
          : `${issues.slice(0, -1).join(', ')} and ${issues[issues.length - 1]}`;
      return `${issueStr} in ${loc}`;
    });
  if (!parts.length) {
    return '';
  }
  if (parts.length === 1) {
    return `Patient is reporting ${parts[0]}.`;
  }
  return `Patient is reporting ${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}.`;
}

// ── Component ──
interface BodySelectorProps {
  onChange?: (selections: Record<string, string[]>) => void;
}

export default function BodySelector({onChange}: BodySelectorProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  // Pulse animation for selected zones
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const update = (next: Record<string, string[]>) => {
    setSelections(next);
    onChange?.(next);
  };

  const toggleZone = (id: string) => {
    const next = {...selections};
    if (id in next) {
      delete next[id];
    } else {
      next[id] = [];
    }
    update(next);
  };

  const toggleSeverity = (zoneId: string, sevId: string) => {
    const current = selections[zoneId] ?? [];
    update({
      ...selections,
      [zoneId]: current.includes(sevId)
        ? current.filter(s => s !== sevId)
        : [...current, sevId],
    });
  };

  const selectedIds = Object.keys(selections);

  // We need to use touch overlay approach since react-native-svg shapes
  // don't support onPress directly in a reliable way on all platforms.
  // We'll render the SVG purely visual, then overlay invisible touchable areas.
  const SVG_WIDTH = 200;
  const SVG_HEIGHT = 380;

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}>
      {/* Interactive SVG body */}
      <View style={styles.svgWrapper}>
        <Svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
          {ZONES.map(({id, shape, props}) => {
            const sel = id in selections;
            const fill = sel
              ? 'rgba(239,68,68,0.28)'
              : 'rgba(255,255,255,0.07)';
            const stroke = sel ? '#ef4444' : 'rgba(255,255,255,0.22)';
            const strokeWidth = sel ? 1.5 : 1;

            if (shape === 'ellipse') {
              return (
                <Ellipse
                  key={id}
                  cx={props.cx}
                  cy={props.cy}
                  rx={props.rx}
                  ry={props.ry}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  opacity={sel ? undefined : 1}
                />
              );
            }
            return (
              <Rect
                key={id}
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                rx={props.rx}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={sel ? undefined : 1}
              />
            );
          })}
        </Svg>

        {/* Touch overlay for each zone */}
        {ZONES.map(({id, shape, props}) => {
          const sel = id in selections;
          let top: number, left: number, width: number, height: number;

          if (shape === 'ellipse') {
            left = props.cx! - props.rx!;
            top = props.cy! - props.ry!;
            width = props.rx! * 2;
            height = props.ry! * 2;
          } else {
            left = props.x!;
            top = props.y!;
            width = props.width!;
            height = props.height!;
          }

          return (
            <TouchableOpacity
              key={id}
              activeOpacity={0.7}
              onPress={() => toggleZone(id)}
              style={[
                styles.zoneTouch,
                {
                  left,
                  top,
                  width,
                  height,
                },
              ]}>
              {sel && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    {opacity: pulseAnim},
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Severity pickers — one card per selected zone */}
      {selectedIds.length > 0 && (
        <View style={styles.severityContainer}>
          {selectedIds.map(zoneId => (
            <View key={zoneId} style={styles.severityCard}>
              {/* Zone header */}
              <View style={styles.severityHeader}>
                <Text style={styles.severityHeaderEmoji}>
                  {ZONE_DISPLAY[zoneId]?.emoji}
                </Text>
                <Text style={styles.severityHeaderLabel}>
                  {ZONE_DISPLAY[zoneId]?.label}
                </Text>
              </View>

              {/* Severity icon buttons */}
              <View style={styles.severityButtons}>
                {SEVERITIES.map(({id: sevId, icon}) => {
                  const active = selections[zoneId]?.includes(sevId);
                  return (
                    <TouchableOpacity
                      key={sevId}
                      activeOpacity={0.8}
                      onPress={() => toggleSeverity(zoneId, sevId)}
                      style={[
                        styles.severityButton,
                        active
                          ? styles.severityButtonActive
                          : styles.severityButtonInactive,
                      ]}>
                      <Text style={styles.severityIcon}>{icon}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  // SVG wrapper — positioned relative for touch overlays
  svgWrapper: {
    width: 200,
    height: 380,
    position: 'relative',
  },
  // Invisible touch zone overlay
  zoneTouch: {
    position: 'absolute',
  },
  // Severity pickers
  severityContainer: {
    marginTop: 8,
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 16,
    gap: 12,
  },
  severityCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    backgroundColor: 'rgba(127,29,29,0.2)',
    padding: 12,
  },
  severityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  severityHeaderEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  severityHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#f87171',
    textTransform: 'uppercase',
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  severityButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  severityButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderColor: 'rgba(239,68,68,0.6)',
  },
  severityButtonInactive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.5,
  },
  severityIcon: {
    fontSize: 24,
  },
});
