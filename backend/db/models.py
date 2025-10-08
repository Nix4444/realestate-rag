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


class ChatFile(models.Model):
    id = fields.UUIDField(pk=True)
    chat = fields.ForeignKeyField("models.Chat", related_name="files", on_delete=fields.CASCADE)
    file_id = fields.CharField(max_length=64, index=True)
    filename = fields.CharField(max_length=255, null=True)
