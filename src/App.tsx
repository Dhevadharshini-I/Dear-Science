import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, User as UserIcon } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Welcome from '@/components/Welcome';
import ChatArea from '@/components/ChatArea';
import ChatInput from '@/components/ChatInput';
import LoginPage from '@/components/LoginPage';
import SignupPage from '@/components/SignupPage';
import ProfilePage from '@/components/ProfilePage';
import { loadConversations, saveConversations, generateId } from '@/lib/storage';
import { fetchAIResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Conversation, Message, StudyMode } from '@/types';

type Page = 'chat' | 'login' | 'signup' | 'profile';

function App() {
  const { session, user, profile, loading } = useAuth();
  const [page, setPage] = useState<Page>('chat');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<StudyMode>('ask');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
  }, []);

  // Persist conversations whenever they change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Auth-based routing: redirect to login when not authenticated
  useEffect(() => {
    if (loading) return;
    if (!session && (page === 'chat' || page === 'profile')) {
      setPage('login');
    }
    if (session && (page === 'login' || page === 'signup')) {
      setPage('chat');
    }
  }, [session, loading, page]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const createConversation = useCallback(
    (firstMessage?: Message): string => {
      const id = generateId();
      const newConv: Conversation = {
        id,
        title: firstMessage
          ? firstMessage.content.slice(0, 40) + (firstMessage.content.length > 40 ? '…' : '')
          : 'New Chat',
        messages: firstMessage ? [firstMessage] : [],
        createdAt: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(id);
      return id;
    },
    [],
  );

  const handleNewChat = useCallback(() => {
    setActiveId(null);
    setSidebarOpen(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
      }
    },
    [activeId],
  );

  const handleSelectMode = useCallback((newMode: StudyMode) => {
    setMode(newMode);
    setSidebarOpen(false);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: text,
        mode,
        createdAt: new Date().toISOString(),
      };

      // Determine target conversation
      let convId = activeId;
      let conversationMessages: Message[];

      if (!convId) {
        convId = createConversation(userMessage);
        conversationMessages = [userMessage];
      } else {
        const existing = conversations.find((c) => c.id === convId);
        conversationMessages = [...(existing?.messages ?? []), userMessage];
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  title:
                    c.messages.length === 0
                      ? text.slice(0, 40) + (text.length > 40 ? '…' : '')
                      : c.title,
                  messages: [...c.messages, userMessage],
                }
              : c,
          ),
        );
      }

      setIsLoading(true);

      try {
        const reply = await fetchAIResponse(conversationMessages, mode);
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: reply,
          mode,
          createdAt: new Date().toISOString(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, assistantMessage] }
              : c,
          ),
        );
      } catch (err) {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          mode,
          createdAt: new Date().toISOString(),
          error: true,
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, errorMessage] }
              : c,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeId, conversations, createConversation, mode],
  );

  // Handle suggestion click from Welcome screen
  const handleSuggestionClick = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend],
  );

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-200">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
          <p className="text-sm text-purple-400">Loading…</p>
        </div>
      </div>
    );
  }

  // --- Auth pages ---
  if (!session) {
    if (page === 'signup') {
      return <SignupPage onNavigate={(p) => setPage(p)} />;
    }
    return <LoginPage onNavigate={(p) => setPage(p)} />;
  }

  // --- Profile page ---
  if (page === 'profile') {
    return <ProfilePage onNavigate={(p) => setPage(p)} />;
  }

  // --- Chat page (default for authenticated users) ---
  const hasMessages = messages.length > 0;

  const handleProfileClick = () => setPage('profile');

  const initials = (profile?.full_name || user?.email || '?')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-purple-50/30">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        conversations={conversations.map((c) => ({ id: c.id, title: c.title }))}
        activeConversationId={activeId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        activeMode={mode}
        onSelectMode={handleSelectMode}
        profileName={profile?.full_name ?? ''}
        profileInitials={initials}
        onProfileClick={handleProfileClick}
      />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile) */}
        <div className="flex items-center gap-3 border-b border-purple-100 bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-gray-700">Dear Science</span>
          {/* Profile avatar (mobile) */}
          <button
            onClick={handleProfileClick}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-xs font-bold text-white"
            aria-label="Profile"
          >
            {initials}
          </button>
        </div>

        {/* Chat or Welcome */}
        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {hasMessages ? (
            <ChatArea messages={messages} isLoading={isLoading} mode={mode} />
          ) : (
            <Welcome mode={mode} onSuggestionClick={handleSuggestionClick} />
          )}
        </div>

        {/* Input */}
        <ChatInput mode={mode} onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;
