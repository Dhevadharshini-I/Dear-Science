import { Sparkles } from 'lucide-react';
import { MODE_LABELS, type StudyMode } from '@/types';
import MessageBubble from './MessageBubble';
import type { Message } from '@/types';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  mode: StudyMode;
}

export default function ChatArea({ messages, isLoading, mode }: ChatAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-purple-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-purple-500" />
                  </div>
                  <span className="text-sm text-gray-400">
                    {MODE_LABELS[mode] === 'Ask Anything' ? 'Thinking...' : 'Generating...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
