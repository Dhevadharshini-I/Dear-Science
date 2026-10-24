import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { MODE_PLACEHOLDERS, MODE_LABELS, type StudyMode } from '@/types';

interface ChatInputProps {
  mode: StudyMode;
  onSend: (text: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ mode, onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-purple-100 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="mx-auto max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-end gap-2 rounded-2xl border border-purple-200 bg-white shadow-sm transition-all focus-within:border-purple-400 focus-within:shadow-md">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={MODE_PLACEHOLDERS[mode]}
              rows={1}
              disabled={isLoading}
              className="max-h-40 flex-1 resize-none bg-transparent px-4 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              style={{ minHeight: '52px' }}
              aria-label={`Question input for ${MODE_LABELS[mode]} mode`}
            />
            <button
              type="submit"
              disabled={!value.trim() || isLoading}
              className="m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-sm transition-all hover:from-purple-600 hover:to-purple-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send question"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-xs text-gray-400">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
