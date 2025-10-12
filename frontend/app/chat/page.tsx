'use client';

import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import MobileTopBar from './components/MobileTopBar';
import MessageList from './components/MessageList';
import TextInput from './components/TextInput';
import { ChatSession, StoredMessage } from './types';
import NewChatDialog from './components/NewChatDialog';

export default function Chat() {
  const [input, setInput] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  async function fetchChats() {
    const res = await fetch(`${apiBase}/app/chats`, { credentials: 'include' });
    const data = await res.json();
    setChats(data);
    if (!currentChatId) {
      if (Array.isArray(data) && data.length > 0) {
        setCurrentChatId(data[0].id);
      } else {
        setNewChatDialog(true);
      }
    }
  }

  async function fetchMessages(chatId: string) {
    if (!chatId) return;
    const res = await fetch(`${apiBase}/app/chats/${chatId}/messages`, { credentials: 'include' });
    const raw = (await res.json()) as { id: string; role: string; content: string; created_at?: string }[];
    const decorated = raw.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAtMs: m.created_at ? Date.parse(m.created_at) : 0,
    }));
    decorated.sort((a, b) => a.createdAtMs - b.createdAtMs);
    const mapped: StoredMessage[] = decorated.map(m => ({ id: m.id, role: m.role.toLowerCase(), parts: [{ type: 'text', text: m.content }] }));
    setMessages(mapped);
  }

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    fetchMessages(currentChatId);
  }, [currentChatId]);

  function createNewSession() {
    setNewChatDialog(true);
  }

  return (
    <>
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
        sessions={chats}
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
        sessions={chats}
        currentChatId={currentChatId}
        onSelect={(id) => setCurrentChatId(id)}
        onNew={createNewSession}
      />

      <main className="flex-1 flex flex-col">

        <MobileTopBar
          onToggleSidebar={() => setIsMobileMenuOpen(s => !s)}
          onNewChat={createNewSession}
        />
        <MessageList messages={messages} />

        <TextInput
          input={input}
          setInput={setInput}
          disabled={isStreaming}
          onSend={async (text) => {
            if (!currentChatId) return;
            if (isStreaming) return;
            const prior = messages.slice(-5).map(m => ({
              role: m.role === 'assistant' ? 'ASSISTANT' : 'USER',
              content: (m.parts.find(p => p.type === 'text') as any)?.text || '',
            }));
            const newUserMsg: StoredMessage = { id: `${Date.now()}`, role: 'user', parts: [{ type: 'text', text }] };
            const assistantId = `${Date.now()}-a`;
            const assistantShell: StoredMessage = { id: assistantId, role: 'assistant', parts: [{ type: 'text', text: '' }] };
            setMessages(prev => [...prev, newUserMsg, assistantShell]);
            setIsStreaming(true);
            try {
              const res = await fetch(`${apiBase}/app/chats/${currentChatId}/messages/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role: 'USER', content: text, history: prior }),
              });
              const reader = res.body?.getReader();
              if (!reader) return;
              let assistantAccum = '';
              const decoder = new TextDecoder();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                assistantAccum += chunk;
                setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, parts: [{ type: 'text', text: assistantAccum }] } : m)));
              }
            } finally {
              setIsStreaming(false);
              fetchMessages(currentChatId);
            }
          }}
        />
      </main>
    </div>
    <NewChatDialog
      open={newChatDialog}
      onOpenChange={setNewChatDialog}
      canCancel={chats.length > 0}
      onCreated={(chat) => {
        if (!chat || !chat.id) return;
        setChats(prev => [chat, ...prev]);
        setCurrentChatId(chat.id);
        setMessages([]);
      }}
    />
    </>
  );
}