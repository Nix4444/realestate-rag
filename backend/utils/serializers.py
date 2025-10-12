from db.models import Chat, Message


def serialize_chat(chat: Chat) -> dict:
    return {"id": str(chat.id), "title": chat.title}


def serialize_message(message: Message) -> dict:
    return {
        "id": str(message.id),
        "chat_id": str(message.chat_id),
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at.isoformat() if getattr(message, "created_at", None) else None,
    }
