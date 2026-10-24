import { Sparkles, MessageSquare, BookOpen, Lightbulb, GraduationCap } from 'lucide-react';
import { MODE_LABELS, MODE_DESCRIPTIONS, type StudyMode } from '@/types';

interface WelcomeProps {
  mode: StudyMode;
  onSuggestionClick: (text: string) => void;
}

const SUGGESTIONS: Record<StudyMode, string[]> = {
  ask: [
    'Why is the sky blue?',
    'How do vaccines work?',
    'What is the difference between DNA and RNA?',
  ],
  simplify: [
    'Explain quantum entanglement',
    'Simplify how blockchain works',
    'Explain photosynthesis simply',
  ],
  summarize: [
    'Summarize the French Revolution',
    'Key points of World War II',
    'Overview of the water cycle',
  ],
  exam: [
    'Cell biology exam notes',
    'Newton\'s laws of motion for exam',
    'World War I revision notes',
  ],
};

const MODE_ICONS: Record<StudyMode, typeof Sparkles> = {
  ask: MessageSquare,
  simplify: Lightbulb,
  summarize: BookOpen,
  exam: GraduationCap,
};

export default function Welcome({ mode, onSuggestionClick }: WelcomeProps) {
  const Icon = MODE_ICONS[mode];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl text-center">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-200">
          <Sparkles className="h-8 w-8 text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
          Ask anything.
          <br />
          <span className="bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
            Understand everything.
          </span>
        </h1>

        <p className="mt-4 text-base text-gray-500 sm:text-lg">
          Your AI-powered study companion for science and beyond.
        </p>

        {/* Mode badge */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-600">
          <Icon className="h-4 w-4" />
          {MODE_LABELS[mode]} Mode
          <span className="text-purple-300">·</span>
          <span className="font-normal text-purple-400">{MODE_DESCRIPTIONS[mode]}</span>
        </div>

        {/* Suggestions */}
        <div className="mt-8">
          <p className="mb-3 text-sm font-medium text-gray-400">Try asking:</p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {SUGGESTIONS[mode].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                className="rounded-xl border border-purple-100 bg-white px-4 py-3 text-left text-sm text-gray-600 shadow-sm transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-md active:scale-[0.98]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
