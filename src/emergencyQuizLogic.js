export const emergencyConfig = {
  police: {
    label: 'Police',
    emoji: '🚔',
    color: '#3b82f6',
    callNumber: '911',
    dispatchPrefix: 'POLICE DISPATCH',
    questions: [
      {
        id: 'situation',
        text: 'What is happening?',
        options: [
          { emoji: '🔫', label: 'Armed threat', value: 'armed' },
          { emoji: '👊', label: 'Violence / fight', value: 'violence' },
          { emoji: '🏠', label: 'Break-in', value: 'breakin' },
          { emoji: '🆘', label: 'Someone in danger', value: 'danger' },
        ],
      },
      {
        id: 'location',
        text: 'Where are you?',
        options: [
          { emoji: '🏢', label: 'Inside building', value: 'inside' },
          { emoji: '🚗', label: 'In a vehicle', value: 'vehicle' },
          { emoji: '🌳', label: 'Outside / street', value: 'outside' },
          { emoji: '🏪', label: 'Public place', value: 'public' },
        ],
      },
    ],
  },
  medical: {
    label: 'Medical',
    emoji: '🚑',
    color: '#ef4444',
    callNumber: '911',
    dispatchPrefix: 'MEDICAL DISPATCH',
    questions: [
      {
        id: 'symptoms',
        text: 'What is happening?',
        options: [
          { emoji: '😵', label: 'Unconscious', value: 'unconscious' },
          { emoji: '🤒', label: 'Serious illness', value: 'illness' },
          { emoji: '✅', label: 'Yes', value: 'breathing_yes' },
          { emoji: '❌', label: 'No', value: 'breathing_no' },
        ],
      },
    ],
  },
  fire: {
    label: 'Fire',
    emoji: '🔥',
    color: '#f97316',
    callNumber: '911',
    dispatchPrefix: 'FIRE DISPATCH',
    questions: [
      {
        id: 'source',
        text: 'What is on fire?',
        options: [
          { emoji: '🏠', label: 'Building / home', value: 'building' },
          { emoji: '🚗', label: 'Vehicle', value: 'vehicle' },
          { emoji: '🌲', label: 'Forest / outdoor', value: 'forest' },
          { emoji: '💥', label: 'Explosion', value: 'explosion' },
        ],
      },
      {
        id: 'trapped',
        text: 'Is anyone trapped?',
        options: [
          { emoji: '🏃', label: 'No, everyone out', value: 'safe' },
          { emoji: '🆘', label: 'Yes, people trapped', value: 'trapped' },
          { emoji: '🚪', label: 'Not sure', value: 'unknown' },
          { emoji: '👁️', label: 'Fire unattended', value: 'unattended' },
        ],
      },
    ],
  },
}

const dispatchPhrases = {
  police: {
    armed: {
      inside: 'Armed individual reported inside a building.',
      vehicle: 'Armed suspect reported in a vehicle.',
      outside: 'Armed threat reported on the street.',
      public: 'Armed threat reported in a public space.',
    },
    violence: {
      inside: 'Physical altercation reported inside a building.',
      vehicle: 'Road-rage incident reported involving vehicles.',
      outside: 'Violent fight reported on the street.',
      public: 'Violent incident reported in a public area.',
    },
    breakin: {
      inside: 'Active break-in reported — caller is inside.',
      vehicle: 'Vehicle being broken into.',
      outside: 'Break-in reported, suspect outside.',
      public: 'Theft in progress in public area.',
    },
    danger: {
      inside: 'Person in immediate danger inside a building.',
      vehicle: 'Person in danger inside a vehicle.',
      outside: 'Person in danger outside on the street.',
      public: 'Person in danger in a public location.',
    },
  },
  medical: {
    unconscious: {
      yes: 'Unconscious person — breathing confirmed.',
      no: 'CRITICAL: Unconscious person NOT breathing. Immediate response required.',
      struggling: 'Unconscious person with labored breathing.',
      unknown: 'Unconscious person found — status unknown.',
    },
    illness: {
      yes: 'Serious illness reported — patient is breathing.',
      no: 'CRITICAL: Serious illness with no breathing detected.',
      struggling: 'Severe illness with breathing difficulty.',
      unknown: 'Serious illness reported. Condition unclear.',
    },
    choking: {
      yes: 'Choking reported — patient is partially breathing.',
      no: 'CRITICAL: Choking — patient is NOT breathing. Airway fully blocked.',
      struggling: 'Choking with severe breathing difficulty. Airway partially blocked.',
      unknown: 'Choking reported. Breathing status unclear.',
    },
  },
  fire: {
    building: {
      safe: 'Structure fire reported — all occupants evacuated.',
      trapped: 'CRITICAL: Structure fire — people are trapped inside.',
      unknown: 'Structure fire with unknown occupant status.',
      unattended: 'Unattended structure fire reported.',
    },
    vehicle: {
      safe: 'Vehicle fire — no occupants.',
      trapped: 'CRITICAL: Vehicle fire with person(s) trapped inside.',
      unknown: 'Vehicle fire — occupant status unknown.',
      unattended: 'Unattended vehicle fire reported.',
    },
    forest: {
      safe: 'Outdoor fire reported — no persons in danger.',
      trapped: 'CRITICAL: Wildfire — people trapped in affected area.',
      unknown: 'Outdoor fire with unknown spread and occupants.',
      unattended: 'Unattended wildfire reported.',
    },
    explosion: {
      safe: 'Explosion reported — area is clear of persons.',
      trapped: 'CRITICAL: Explosion with persons trapped.',
      unknown: 'Explosion reported — damage and casualties unknown.',
      unattended: 'Explosion reported at unoccupied location.',
    },
  },
}

export function generateDispatchPhrase(type, answers) {
  const config = emergencyConfig[type]

  // Medical uses multi-select symptoms array
  if (type === 'medical') {
    const symptoms = answers.symptoms ?? []
    const labels = {
      unconscious: 'unconscious patient',
      illness: 'serious illness',
      breathing_yes: 'breathing confirmed',
      breathing_no: 'NOT breathing — may require CPR',
    }
    const desc = symptoms.length
      ? symptoms.map(s => labels[s] || s).join(', ')
      : 'medical emergency'
    return `${config.dispatchPrefix}: Patient presenting with ${desc}. Location being confirmed. Caller requires immediate assistance.`
  }

  // Police / fire — lookup table
  const q1Key = Object.keys(answers)[0]
  const q2Key = Object.keys(answers)[1]
  const q1Val = answers[q1Key]
  const q2Val = answers[q2Key]

  const phraseMap = dispatchPhrases[type]
  const core = phraseMap?.[q1Val]?.[q2Val]
    ?? `Emergency situation requiring immediate ${type} response.`

  return `${config.dispatchPrefix}: ${core} Location being confirmed. Caller requires immediate assistance.`
}
