export type StoredMessagePart = { type: string; text?: string };
export type StoredMessage = { id: string; role: string; parts: StoredMessagePart[] };
export type ChatSession = { id: string; title: string };


