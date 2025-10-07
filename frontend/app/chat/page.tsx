'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import MobileTopBar from './components/MobileTopBar';
import MessageList from './components/MessageList';
import TextInput from './components/TextInput';
import { ChatSession, StoredMessage, StoredMessagePart } from './types';

export default function Chat() {
  const [input, setInput] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  const { messages, sendMessage } = useChat({ id: currentChatId });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);



  const [sessions, setSessions] = useState<ChatSession[]>([{ id: 'default', title: 'New chat', createdAt: Date.now() }]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('chat:sessions');
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSession[];
        if (Array.isArray(parsed) && parsed.length > 0) setSessions(parsed);
      }
      const savedCurrent = window.localStorage.getItem('chat:current-id');
      if (savedCurrent) setCurrentChatId(savedCurrent);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('chat:sessions', JSON.stringify(sessions));
      window.localStorage.setItem('chat:current-id', currentChatId);
    } catch {}
  }, [sessions, currentChatId]);


  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(`chat:messages:${currentChatId}`, JSON.stringify(messages as unknown as StoredMessage[]));
      const firstUserText = messages
        .flatMap(m => (m.role === 'user' ? m.parts : []))
        .map(p => (p.type === 'text' ? (p as StoredMessagePart).text || '' : ''))
        .find(Boolean);
      if (firstUserText) {
        setSessions(prev => prev.map(s => (s.id === currentChatId ? { ...s, title: truncate(firstUserText, 32) } : s)));
      }
    } catch {}
  }, [messages, currentChatId]);

  const currentMessages: StoredMessage[] = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(`chat:messages:${currentChatId}`);
      return raw ? (JSON.parse(raw) as StoredMessage[]) : [];
    } catch {
      return [];
    }
  }, [currentChatId]);

  function truncate(text: string, max: number) {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  function createNewSession() {
    const newId = `${Date.now()}`;
    const newSession: ChatSession = { id: newId, title: 'New chat', createdAt: Date.now() };
    setSessions(prev => [newSession, ...prev]);
    setCurrentChatId(newId);

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(`chat:messages:${newId}`);
      } catch {}
    }
  }

  return (
    <div className="flex h-screen w-full text-sm bg-zinc-50 dark:bg-zinc-950">      
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      <Sidebar
        variant="mobile"
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        sessions={sessions}
        currentChatId={currentChatId}
        onSelect={(id) => {
          setCurrentChatId(id);
          setIsMobileMenuOpen(false);
        }}
        onNew={() => {
          createNewSession();
          setIsMobileMenuOpen(false);
        }}
      />


      <Sidebar
        variant="desktop"
        sessions={sessions}
        currentChatId={currentChatId}
        onSelect={(id) => setCurrentChatId(id)}
        onNew={createNewSession}
      />

      <main className="flex-1 flex flex-col">

        <MobileTopBar
          onToggleSidebar={() => setIsMobileMenuOpen(s => !s)}
          onNewChat={createNewSession}
        />
        <MessageList messages={(messages.length > 0 ? (messages as unknown as StoredMessage[]) : currentMessages)} />

        <TextInput
          input={input}
          setInput={setInput}
          onSend={(text) => sendMessage({ text })}
        />
      </main>
    </div>
  );
}