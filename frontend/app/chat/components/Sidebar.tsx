'use client';

import Image from 'next/image';
import { ChatSession } from '@/app/chat/types';
import { Button } from '@/components/ui/button';

type SidebarProps = {
  sessions: ChatSession[];
  currentChatId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  disableNew?: boolean;
  variant?: 'desktop' | 'mobile';
  open?: boolean;     
  onClose?: () => void;     
};

export default function Sidebar({
  sessions,
  currentChatId,
  onSelect,
  onNew,
  disableNew = false,
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
          <Button
            onClick={onClose}
            size="icon"
            variant="ghost"
            aria-label="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29 10.59 10.6l6.3-6.31z" />
            </svg>
          </Button>
        </div>
        <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
          <Button
            onClick={() => {
              if (disableNew) return;
              onNew();
              onClose && onClose();
            }}
            className="w-full"
            disabled={disableNew}
          >
            New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="p-2 space-y-1">
            {sessions.filter(Boolean).map(s => (
              <li key={s.id}>
                <Button
                  onClick={() => {
                    onSelect(s.id);
                    onClose && onClose();
                  }}
                  variant="ghost"
                  className={`w-full justify-start ${
                    currentChatId && s?.id && currentChatId === s.id ? 'bg-zinc-100 dark:bg-zinc-900' : ''
                  }`}
                >
                  <div className="truncate">{s.title || 'Untitled'}</div>
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            onClick={async () => {
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/logout`, {
                  method: 'POST',
                  credentials: 'include',
                });
                window.location.href = '/signin';
              } catch (e) {}
            }}
            variant="outline"
            className="w-full cursor-pointer"
          >
            Logout
          </Button>
        </div>
      </aside>
    );
  }

   
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="font-semibold text-lg">SimplyPhi</div>
        <Button className="cursor-pointer" onClick={() => !disableNew && onNew()} disabled={disableNew}>New Chat</Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-1">
          {sessions.filter(Boolean).map(s => (
            <li key={s.id}>
              <Button
                onClick={() => onSelect(s.id)}
                variant="ghost"
                className={`w-full justify-start ${
                  currentChatId && s?.id && currentChatId === s.id ? 'bg-zinc-100 dark:bg-zinc-900' : ''
                }`}
              >
                <div className="truncate cursor-pointer">{s.title || 'Untitled'}</div>
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <Button
          onClick={async () => {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
              });
              window.location.href = '/signin';
            } catch (e) {}
          }}
          variant="outline"
          className="w-full cursor-pointer"
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}


