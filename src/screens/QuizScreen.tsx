import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import {emergencyConfig} from '../emergencyQuizLogic';
import BodySelector from '../components/BodySelector';

type EmergencyType = 'police' | 'medical' | 'fire';

interface QuizScreenProps {
  type: EmergencyType;
  onComplete: (answers: Record<string, any>) => void;
  onBack: () => void;
}

export default function QuizScreen({type, onComplete, onBack}: QuizScreenProps) {
  const config = (emergencyConfig as any)[type];
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [phase, setPhase] = useState<'quiz' | 'body'>('quiz');
  const [bodySelections, setBodySelections] = useState<Record<string, any>>({});
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Transition animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in on question change
    fadeAnim.setValue(0);
    slideAnim.setValue(8);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [questionIdx, fadeAnim, slideAnim]);

  const currentQuestion = config.questions[questionIdx];
  const totalQuestions = config.questions.length;
  const totalSteps = type === 'medical' ? 2 : totalQuestions;
  const progress = ((questionIdx + (selected ? 1 : 0)) / totalSteps) * 100;

  const animateOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleSelect = (value: string) => {
    if (transitioning) {
      return;
    }
    setSelected(value);

    setTimeout(() => {
      const newAnswers = {...answers, [currentQuestion.id]: value};
      setAnswers(newAnswers);
      setTransitioning(true);

      animateOut(() => {
        if (questionIdx + 1 < totalQuestions) {
          setQuestionIdx(questionIdx + 1);
          setSelected(null);
          setTransitioning(false);
        } else if (type === 'medical') {
          setPhase('body');
          setTransitioning(false);
          setSelected(null);
        } else {
          onComplete(newAnswers);
        }
      });
    }, 500);
  };

  // Back button component
  const BackButton = ({onPress}: {onPress: () => void}) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.backButton}>
      <Text style={styles.backArrow}>‹</Text>
    </TouchableOpacity>
  );

  // Header badge component
  const HeaderBadge = () => (
    <View style={styles.headerBadgeRow}>
      <View
        style={[
          styles.headerBadgeIcon,
          {
            backgroundColor: `${config.color}20`,
            borderColor: `${config.color}40`,
          },
        ]}>
        <Text style={styles.headerBadgeEmoji}>{config.emoji}</Text>
      </View>
      <Text style={styles.headerBadgeLabel}>
        {config.label.toUpperCase()} EMERGENCY
      </Text>
    </View>
  );

  // Progress bar component
  const ProgressBar = ({
    step,
    total,
    pct,
  }: {
    step: number;
    total: number;
    pct: number;
  }) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressLabels}>
        <Text style={styles.progressStep}>
          Question {step} of {total}
        </Text>
        <Text style={[styles.progressPct, {color: config.color}]}>
          {Math.round(pct)}%
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: config.color,
            },
          ]}
        />
      </View>
    </View>
  );

  // Check indicator for selected options
  const CheckMark = ({color}: {color: string}) => (
    <View style={[styles.checkMark, {backgroundColor: color}]}>
      <Text style={styles.checkIcon}>✓</Text>
    </View>
  );

  // Option card component
  const OptionCard = ({
    emoji,
    label,
    isSel,
    color: cardColor,
    onPress,
    disabled,
  }: {
    emoji: string;
    label: string;
    isSel: boolean;
    color: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.optionCard,
        {
          backgroundColor: isSel ? `${cardColor}15` : '#111',
          borderColor: isSel ? cardColor : 'rgba(255,255,255,0.08)',
          shadowColor: isSel ? cardColor : 'transparent',
          shadowOpacity: isSel ? 0.3 : 0,
          shadowRadius: isSel ? 20 : 0,
          shadowOffset: {width: 0, height: 0},
          elevation: isSel ? 6 : 0,
        },
      ]}>
      <View style={styles.optionContent}>
        <Text style={styles.optionEmoji}>{emoji}</Text>
        <Text
          style={[
            styles.optionLabel,
            {color: isSel ? '#ffffff' : 'rgba(255,255,255,0.65)'},
          ]}>
          {label}
        </Text>
      </View>
      {isSel && <CheckMark color={cardColor} />}
    </TouchableOpacity>
  );

  // ─── MEDICAL MULTI-SELECT SCREEN ───
  if (type === 'medical' && phase === 'quiz') {
    const symptomsQ = config.questions[0];
    const toggle = (val: string) =>
      setSelectedSymptoms(prev => {
        if (prev.includes(val)) {
          return prev.filter((v: string) => v !== val);
        }
        const opposite =
          val === 'breathing_yes'
            ? 'breathing_no'
            : val === 'breathing_no'
              ? 'breathing_yes'
              : null;
        return [...prev.filter((v: string) => v !== opposite), val];
      });

    return (
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.headerRow}>
          <BackButton onPress={onBack} />
          <HeaderBadge />
        </View>

        {/* Progress — step 1 of 2 */}
        <ProgressBar step={1} total={2} pct={50} />

        {/* Question */}
        <Text style={styles.questionText}>{symptomsQ.text}</Text>
        <Text style={styles.helperText}>Select all that apply</Text>

        {/* Condition options — multi-select */}
        <View style={styles.optionsGrid}>
          {symptomsQ.options
            .filter((o: any) => !o.value.startsWith('breathing_'))
            .map((option: any) => (
              <View key={option.value} style={styles.optionHalf}>
                <OptionCard
                  emoji={option.emoji}
                  label={option.label}
                  isSel={selectedSymptoms.includes(option.value)}
                  color={config.color}
                  onPress={() => toggle(option.value)}
                />
              </View>
            ))}
        </View>

        {/* Breathing section */}
        <View style={styles.breathingHeader}>
          <Text style={styles.breathingEmoji}>💨</Text>
          <Text style={styles.breathingLabel}>BREATHING?</Text>
        </View>
        <View style={styles.optionsGrid}>
          {[
            {emoji: '✅', label: 'Yes', value: 'breathing_yes', color: '#22c55e'},
            {emoji: '❌', label: 'No', value: 'breathing_no', color: '#ef4444'},
          ].map(option => (
            <View key={option.value} style={styles.optionHalf}>
              <OptionCard
                emoji={option.emoji}
                label={option.label}
                isSel={selectedSymptoms.includes(option.value)}
                color={option.color}
                onPress={() => toggle(option.value)}
              />
            </View>
          ))}
        </View>

        {/* Continue button */}
        <View style={styles.continueWrapper}>
          <TouchableOpacity
            onPress={() => {
              setAnswers({symptoms: selectedSymptoms});
              setPhase('body');
            }}
            disabled={selectedSymptoms.length === 0}
            activeOpacity={0.8}
            style={[
              styles.continueButton,
              {
                backgroundColor: config.color,
                opacity: selectedSymptoms.length === 0 ? 0.3 : 1,
                shadowColor: selectedSymptoms.length > 0 ? config.color : 'transparent',
                shadowOpacity: selectedSymptoms.length > 0 ? 0.4 : 0,
                shadowRadius: 32,
                shadowOffset: {width: 0, height: 8},
                elevation: selectedSymptoms.length > 0 ? 8 : 0,
              },
            ]}>
            <Text style={styles.continueArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── BODY MAP PHASE (MEDICAL ONLY) ───
  if (phase === 'body') {
    return (
      <View style={styles.screenNoHPad}>
        {/* Header */}
        <View style={[styles.headerRow, {paddingHorizontal: 20}]}>
          <BackButton
            onPress={() => {
              setPhase('quiz');
              setQuestionIdx(0);
              setSelected(null);
              setSelectedSymptoms([]);
              setTransitioning(false);
            }}
          />
          <HeaderBadge />
        </View>

        {/* Progress — step 2 of 2 */}
        <View style={{paddingHorizontal: 20, marginBottom: 24}}>
          <ProgressBar step={totalSteps} total={totalSteps} pct={100} />
        </View>

        {/* Body selector */}
        <View style={styles.bodyScrollArea}>
          <BodySelector
            onChange={sels => setBodySelections(sels)}
          />
        </View>

        {/* Continue button */}
        <View style={[styles.continueWrapperBottom, {paddingHorizontal: 20}]}>
          <TouchableOpacity
            onPress={() => onComplete({...answers, bodySelections})}
            activeOpacity={0.8}
            style={[
              styles.continueButton,
              {
                backgroundColor: config.color,
                shadowColor: config.color,
                shadowOpacity: 0.4,
                shadowRadius: 32,
                shadowOffset: {width: 0, height: 8},
                elevation: 8,
              },
            ]}>
            <Text style={styles.continueArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── POLICE / FIRE SINGLE-SELECT SCREEN ───
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.headerRow}>
        <BackButton onPress={onBack} />
        <HeaderBadge />
      </View>

      {/* Progress bar */}
      <ProgressBar
        step={questionIdx + 1}
        total={totalSteps}
        pct={progress}
      />

      {/* Question */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
          marginBottom: 32,
        }}>
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
        <Text style={styles.helperTextAlt}>
          Tap the option that best describes your situation
        </Text>
      </Animated.View>

      {/* Options grid */}
      <Animated.View
        style={[
          styles.optionsGrid,
          {
            opacity: fadeAnim,
            transform: [{translateY: Animated.multiply(slideAnim, -1)}],
          },
        ]}>
        {currentQuestion.options.map((option: any) => {
          const isSelected = selected === option.value;
          return (
            <View key={option.value} style={styles.optionHalf}>
              <TouchableOpacity
                onPress={() => handleSelect(option.value)}
                disabled={!!selected}
                activeOpacity={0.8}
                style={[
                  styles.optionCardLarge,
                  {
                    backgroundColor: isSelected ? `${config.color}15` : '#111',
                    borderColor: isSelected
                      ? config.color
                      : 'rgba(255,255,255,0.08)',
                    shadowColor: isSelected ? config.color : 'transparent',
                    shadowOpacity: isSelected ? 0.3 : 0,
                    shadowRadius: isSelected ? 20 : 0,
                    shadowOffset: {width: 0, height: 0},
                    elevation: isSelected ? 6 : 0,
                  },
                ]}>
                <View style={styles.optionContentLarge}>
                  <Text style={styles.optionEmojiLarge}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabelLarge,
                      {
                        color: isSelected
                          ? '#ffffff'
                          : 'rgba(255,255,255,0.65)',
                      },
                    ]}>
                    {option.label}
                  </Text>
                </View>
                {isSelected && <CheckMark color={config.color} />}
              </TouchableOpacity>
            </View>
          );
        })}
      </Animated.View>

      {/* Footer */}
      <View style={styles.quizFooter}>
        <Text style={styles.quizFooterText}>
          Your answers help dispatch the right help faster
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Screen containers ───
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 48,
  },
  screenNoHPad: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingBottom: 0,
    paddingTop: 48,
  },

  // ─── Header ───
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.5)',
    marginTop: -2,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeEmoji: {
    fontSize: 16,
  },
  headerBadgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  },

  // ─── Progress bar ───
  progressContainer: {
    marginBottom: 32,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressStep: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  progressPct: {
    fontSize: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  // ─── Question text ───
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 30,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 24,
  },
  helperTextAlt: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },

  // ─── Options grid (2 columns) ───
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  optionHalf: {
    width: '48.5%',
  },

  // ─── Option card (medical multi-select, smaller) ───
  optionCard: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 80,
    overflow: 'hidden',
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  optionEmoji: {
    fontSize: 36,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },

  // ─── Option card (police/fire single-select, larger) ───
  optionCardLarge: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 100,
    overflow: 'hidden',
  },
  optionContentLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  optionEmojiLarge: {
    fontSize: 36,
  },
  optionLabelLarge: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ─── Check mark ───
  checkMark: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkIcon: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },

  // ─── Breathing section ───
  breathingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  breathingEmoji: {
    fontSize: 20,
  },
  breathingLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.5)',
  },

  // ─── Continue button ───
  continueWrapper: {
    marginTop: 'auto',
    paddingTop: 32,
  },
  continueWrapperBottom: {
    paddingBottom: 32,
    paddingTop: 16,
  },
  continueButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },

  // ─── Body map placeholder ───
  bodyScrollArea: {
    flex: 1,
  },

  // ─── Footer ───
  quizFooter: {
    marginTop: 'auto',
    paddingTop: 32,
    alignItems: 'center',
  },
  quizFooterText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
  },
});
