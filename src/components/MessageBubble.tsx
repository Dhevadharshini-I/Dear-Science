import { useState } from 'react';
import { Copy, Check, AlertCircle, User, Sparkles } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isError = message.error;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be unavailable
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] items-start gap-2.5 sm:max-w-[75%]">
          <div className="rounded-2xl rounded-tr-md bg-gradient-to-br from-purple-500 to-purple-600 px-4 py-3 text-sm text-white shadow-sm">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100">
            <User className="h-4 w-4 text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[88%] items-start gap-2.5 sm:max-w-[80%]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="group relative min-w-0 flex-1 rounded-2xl rounded-tl-md border border-purple-100 bg-white px-4 py-3 shadow-sm">
          {isError ? (
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-600">{message.content}</p>
            </div>
          ) : (
            <>
              <div className="text-sm">
                <MarkdownRenderer content={message.content} />
              </div>
              <button
                onClick={handleCopy}
                className="absolute -bottom-3 right-3 flex items-center gap-1 rounded-full border border-purple-100 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 opacity-0 shadow-sm transition-all hover:text-purple-600 group-hover:opacity-100"
                aria-label="Copy answer"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
