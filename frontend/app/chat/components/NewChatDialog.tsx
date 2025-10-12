'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Chat = { id: string; title: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (chat: Chat) => void;
  canCancel?: boolean;
};

export default function NewChatDialog({ open, onOpenChange, onCreated, canCancel = true }: Props) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return;
        if (next || canCancel) onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={canCancel && !submitting}>
        <DialogHeader>
          <DialogTitle>New chat</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (submitting || !file) return;
            setSubmitting(true);
            try {
              const fd = new FormData();
              if (title.trim()) fd.append('title', title.trim());
              fd.append('file', file);
              const res = await fetch(`${apiBase}/app/newChat`, {
                method: 'POST',
                credentials: 'include',
                body: fd,
              });
              const result = await res.json();
              onCreated(result.chat as Chat);
              setTitle('');
              setFile(null);
              onOpenChange(false);
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 text-sm">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          </div>
          <div>
            <label className="block mb-1 text-sm">Upload file (.csv or .json)</label>
            <Input
              type="file"
              accept=".csv,.json,application/json,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex justify-end gap-2r">
            <Button className="cursor-pointer" type="submit" disabled={!file || submitting || !title.trim()}>Create</Button>
          </div>
        </form>
        {submitting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-black/50 rounded-lg">
            <div className="flex items-center gap-3 text-sm">
              <svg className="animate-spin h-5 w-5 text-zinc-700 dark:text-zinc-200" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Generating embeddings…</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


