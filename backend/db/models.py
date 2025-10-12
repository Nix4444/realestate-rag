from tortoise import fields, models

ROLE_CHOICES = ["USER", "ASSISTANT"]

class User(models.Model):
    id = fields.UUIDField(pk=True)
    email = fields.CharField(max_length=255, unique=True)
    password = fields.CharField(max_length=255)
    chats: fields.ReverseRelation["Chat"]

class Chat(models.Model):
    id = fields.UUIDField(pk=True)
    user = fields.ForeignKeyField("models.User", related_name="chats", on_delete=fields.CASCADE)
    title = fields.CharField(max_length=255)
    messages: fields.ReverseRelation["Message"]
    files: fields.ReverseRelation["ChatFile"]

class Message(models.Model):
    id = fields.UUIDField(pk=True)
    chat = fields.ForeignKeyField("models.Chat", related_name="messages", on_delete=fields.CASCADE)
    role = fields.CharField(max_length=50, choices=ROLE_CHOICES)
    content = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)
