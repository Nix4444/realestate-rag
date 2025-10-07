'use client';

type ComposerProps = {
  input: string;
  setInput: (v: string) => void;
  onSend: (text: string) => void;
};

export default function TextInput({ input, setInput, onSend }: ComposerProps) {
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!input.trim()) return;
        onSend(input.trim());
        setInput('');
      }}
      className="border-t border-zinc-200 dark:border-zinc-800 p-4"
    >
      <div className="mx-auto w-full max-w-3xl flex items-end gap-2">
        <div className="flex-1 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-600">
          <textarea
            rows={1}
            className="w-full resize-none bg-transparent outline-none placeholder:text-zinc-400 text-sm md:text-base"
            value={input}
            placeholder="Say something..."
            onChange={e => setInput(e.currentTarget.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  onSend(input.trim());
                  setInput('');
                }
              }
            }}
          />
        </div>
        <button
          type="submit"
          className="h-10 w-10 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 cursor-pointer"
          disabled={!input.trim()}
          aria-label="Send"
          title="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3.4 21l17.77-8.13a1 1 0 000-1.8L3.4 3l-.01 6.84L15 12 3.39 14.16 3.4 21z" />
          </svg>
        </button>
      </div>
    </form>
  );
}


