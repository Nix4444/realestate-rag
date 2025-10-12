'use client';
import { StoredMessage, StoredMessagePart } from '@/app/chat/types';

type MessageListProps = {
  messages: StoredMessage[];
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
//this is for parsing pretty text from the model.
function simpleMarkdownToHtml(input: string): string {
  let html = escapeHtml(input);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*(.+?)\*/g, '$1<em>$2</em>');
  html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scrollbar-dark">
      {messages.map(message => {
        const isAssistant = message.role !== 'user';
        const textParts = message.parts.filter(p => p.type === 'text') as StoredMessagePart[];
        const hasText = textParts.some(p => ((p.text || '').trim().length > 0));

        return (
        <div key={message.id} className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {message.role !== 'user' && (
            <div className="mr-3 mt-1">
              <div className="h-8 w-8 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <img src="/simplyphiLogo.png" alt="AI" width={24} height={24} />
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
            {isAssistant && !hasText ? (
              <div className="h-4 w-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
            ) : (
              textParts.map((part, i) => (
                isAssistant
                  ? <div key={`${message.id}-${i}`} dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(part.text || '') }} />
                  : <div key={`${message.id}-${i}`}>{part.text}</div>
              ))
            )}
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
        );
      })}
    </div>
  );
}


