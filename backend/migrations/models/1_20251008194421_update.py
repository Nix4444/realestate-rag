from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "chatfile" (
    "id" UUID NOT NULL PRIMARY KEY,
    "file_id" VARCHAR(64) NOT NULL,
    "filename" VARCHAR(255),
    "chat_id" UUID NOT NULL REFERENCES "chat" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_chatfile_file_id_2fbf09" ON "chatfile" ("file_id");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "chatfile";"""
