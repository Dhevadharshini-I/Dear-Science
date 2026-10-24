import { Sparkles, MessageSquare, BookOpen, Lightbulb, GraduationCap, Trash2, Menu, X } from 'lucide-react';
import { MODE_LABELS, type StudyMode } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  conversations: { id: string; title: string }[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  activeMode: StudyMode;
  onSelectMode: (mode: StudyMode) => void;
  profileName: string;
  profileInitials: string;
  onProfileClick: () => void;
}

const MODE_ICONS: Record<StudyMode, typeof Sparkles> = {
  ask: MessageSquare,
  simplify: Lightbulb,
  summarize: BookOpen,
  exam: GraduationCap,
};

export default function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  activeMode,
  onSelectMode,
  profileName,
  profileInitials,
  onProfileClick,
}: SidebarProps) {
  const modes: StudyMode[] = ['ask', 'simplify', 'summarize', 'exam'];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-purple-100 bg-white/80 backdrop-blur-md transition-transform duration-300 ease-out
          lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800 leading-tight">Dear Science</h1>
              <p className="text-xs text-purple-400">Study Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-4 pb-4">
          <button
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-md active:scale-[0.98]"
          >
            <MessageSquare className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* Study Modes */}
        <div className="px-4 pb-2">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Study Modes
          </p>
          <div className="space-y-1">
            {modes.map((mode) => {
              const Icon = MODE_ICONS[mode];
              const isActive = activeMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onSelectMode(mode)}
                  className={`
                    flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                  {MODE_LABELS[mode]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 my-3 border-t border-purple-100" />

        {/* Chat History */}
        <div className="flex min-h-0 flex-1 flex-col px-4">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Chat History
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-2 py-4 text-sm text-gray-400">No conversations yet</p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      className={`
                        group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all cursor-pointer
                        ${isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-purple-50'}
                      `}
                      onClick={() => onSelectConversation(conv.id)}
                    >
                      <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-purple-500' : 'text-gray-300'}`} />
                      <span className="flex-1 truncate">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Profile button + footer */}
        <div className="border-t border-purple-100 px-4 py-3">
          <button
            onClick={onProfileClick}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm transition-all hover:bg-purple-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-xs font-bold text-white">
              {profileInitials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate font-medium text-gray-700">{profileName || 'Your profile'}</p>
              <p className="text-xs text-gray-400">View profile & log out</p>
            </div>
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">
            Powered by Gemini AI
          </p>
        </div>
      </aside>
    </>
  );
}
