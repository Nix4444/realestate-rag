'use client';

import Image from 'next/image';
import { StoredMessage, StoredMessagePart } from '@/app/chat/types';

type MessageListProps = {
  messages: StoredMessage[];
};

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
      {messages.map(message => (
        <div key={message.id} className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {message.role !== 'user' && (
            <div className="mr-3 mt-1">
              <div className="h-8 w-8 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <Image src="/simplyphiLogo.png" alt="AI" width={24} height={24} />
              </div>
            </div>
          )}
          <div
            className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
              message.role === 'user'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {message.parts.map((part, i) => {
              if (part.type === 'text') {
                return <div key={`${message.id}-${i}`}>{(part as StoredMessagePart).text}</div>;
              }
              return null;
            })}
          </div>
          {message.role === 'user' && (
            <div className="ml-3 mt-1">
              <div className="h-8 w-8 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v3h16v-3c0-2.761-3.582-5-8-5z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


