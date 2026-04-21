export const defaultCrosswordEntries = [
  { id: 1, row: 0, col: 0, direction: 'across', clue: 'Interfaz para comunicar sistemas', answer: 'API' },
  { id: 2, row: 0, col: 0, direction: 'down', clue: 'Aplicación instalada en un dispositivo', answer: 'APP' },
  { id: 3, row: 0, col: 2, direction: 'down', clue: 'Sigla corta de inteligencia artificial', answer: 'IA' },
  { id: 4, row: 2, col: 3, direction: 'across', clue: 'Modelo de objetos del documento', answer: 'DOM' },
  { id: 5, row: 2, col: 5, direction: 'down', clue: 'Función que asocia un valor a otro', answer: 'MAP' },
  { id: 6, row: 4, col: 0, direction: 'across', clue: 'Aplicación web progresiva', answer: 'PWA' },
]

function cloneTriviaQuestions(questions) {
  return questions.map((question) => ({
    ...question,
    options: (question.options || []).map((option) => ({ ...option })),
  }))
}

function cloneMatchingPairs(pairs) {
  return pairs.map((pair) => ({ ...pair }))
}

function cloneCrosswordEntries(entries) {
  return entries.map((entry) => ({ ...entry }))
}

export function buildDefaultActivityConfig(activityType = 'trivia') {
  if (activityType === 'matching') {
    const pairs = [
      { id: 1, left: 'API', right: 'Interfaz para comunicar sistemas' },
      { id: 2, left: 'Frontend', right: 'Capa visual que usa el alumno' },
      { id: 3, left: 'Backend', right: 'Lógica y datos del servidor' },
      { id: 4, left: 'Router', right: 'Gestiona navegación y rutas' },
      { id: 5, left: 'Componente', right: 'Bloque reutilizable de interfaz' },
    ]

    return {
      title: 'Relaciona conceptos y definiciones',
      description: 'Empareja cada concepto con su definición correcta.',
      points_per_pair: 10,
      pairs: cloneMatchingPairs(pairs),
    }
  }

  if (activityType === 'crossword') {
    return {
      title: 'Crucigrama de conceptos base',
      description: 'Completa el tablero usando las pistas horizontales y verticales.',
      rows: 5,
      cols: 6,
      points_per_word: 10,
      entries: cloneCrosswordEntries(defaultCrosswordEntries),
    }
  }

  const questions = [
    {
      id: 1,
      prompt: '¿Qué capa suele encargarse de la lógica y acceso a datos?',
      options: [
        { id: 'a', text: 'Backend', is_correct: true },
        { id: 'b', text: 'CSS', is_correct: false },
        { id: 'c', text: 'Diseño gráfico', is_correct: false },
        { id: 'd', text: 'SEO', is_correct: false },
      ],
      points: 10,
    },
    {
      id: 2,
      prompt: '¿Qué sigla describe una interfaz para comunicar sistemas?',
      options: [
        { id: 'a', text: 'DOM', is_correct: false },
        { id: 'b', text: 'API', is_correct: true },
        { id: 'c', text: 'SPA', is_correct: false },
        { id: 'd', text: 'PWA', is_correct: false },
      ],
      points: 10,
    },
    {
      id: 3,
      prompt: '¿Qué concepto representa un bloque reutilizable de interfaz?',
      options: [
        { id: 'a', text: 'Componente', is_correct: true },
        { id: 'b', text: 'Servidor DNS', is_correct: false },
        { id: 'c', text: 'Webhook', is_correct: false },
        { id: 'd', text: 'Firewall', is_correct: false },
      ],
      points: 10,
    },
    {
      id: 4,
      prompt: '¿Qué tipo de app puede instalarse y comportarse como nativa en web?',
      options: [
        { id: 'a', text: 'PWA', is_correct: true },
        { id: 'b', text: 'PDF', is_correct: false },
        { id: 'c', text: 'ZIP', is_correct: false },
        { id: 'd', text: 'CSV', is_correct: false },
      ],
      points: 10,
    },
    {
      id: 5,
      prompt: '¿Qué capa visualiza datos e interacción del usuario?',
      options: [
        { id: 'a', text: 'Frontend', is_correct: true },
        { id: 'b', text: 'Database seed', is_correct: false },
        { id: 'c', text: 'Queue worker', is_correct: false },
        { id: 'd', text: 'Kernel', is_correct: false },
      ],
      points: 10,
    },
  ]

  return {
    title: 'Trivia de conceptos base',
    description: 'Responde las preguntas para validar comprensión del tema.',
    questions: cloneTriviaQuestions(questions),
  }
}
