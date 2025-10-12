'use client';

type MobileTopBarProps = {
  onToggleSidebar: () => void;
  onNewChat: () => void;
};

export default function MobileTopBar({ onToggleSidebar, onNewChat }: MobileTopBarProps) {
  return (
    <div className="md:hidden sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          className="h-9 w-9 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center cursor-pointer"
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
          </svg>
        </button>
        <div className="font-semibold">SimplyPhi</div>
      </div>
      <button
        onClick={onNewChat}
        className="h-9 w-9 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center hover:opacity-90 cursor-pointer"
        aria-label="New chat"
      >
        +
      </button>
    </div>
  );
}


