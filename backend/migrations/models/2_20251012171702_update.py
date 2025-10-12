from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "chatfile" ADD "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "message" ADD "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "message" DROP COLUMN "created_at";
        ALTER TABLE "chatfile" DROP COLUMN "created_at";"""
