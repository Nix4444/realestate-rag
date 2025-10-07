'use client';

import Image from 'next/image';
import { ChatSession } from '@/app/chat/types';

type SidebarProps = {
  sessions: ChatSession[];
  currentChatId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  variant?: 'desktop' | 'mobile';
  open?: boolean;     
  onClose?: () => void;     
};

export default function Sidebar({
  sessions,
  currentChatId,
  onSelect,
  onNew,
  variant = 'desktop',
  open = false,
  onClose,
}: SidebarProps) {
  if (variant === 'mobile') {
    return (
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transform transition-transform duration-200 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <Image src="/simplyphiLogo.png" alt="SimplyPhi" width={16} height={16} />
            </div>
            <div className="font-semibold">SimplyPhi</div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center cursor-pointer"
            aria-label="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29 10.59 10.6l6.3-6.31z" />
            </svg>
          </button>
        </div>
        <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => {
              onNew();
              onClose && onClose();
            }}
            className="w-full px-3 py-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 cursor-pointer"
          >
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="p-2 space-y-1">
            {sessions.map(s => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    onSelect(s.id);
                    onClose && onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer ${
                    currentChatId === s.id ? 'bg-zinc-100 dark:bg-zinc-900' : ''
                  }`}
                >
                  <div className="truncate">{s.title || 'Untitled'}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    );
  }

   
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="font-semibold text-lg">SimplyPhi</div>
        <button
          onClick={onNew}
          className="px-4 py-1 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 text-lg cursor-pointer"
        >
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-1">
          {sessions.map(s => (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer ${
                  currentChatId === s.id ? 'bg-zinc-100 dark:bg-zinc-900' : ''
                }`}
              >
                <div className="truncate">{s.title || 'Untitled'}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}


