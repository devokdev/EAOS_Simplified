import json
import asyncpg
from .config import DATABASE_URL

_pool: asyncpg.Pool | None = None


async def _init_connection(conn: asyncpg.Connection):
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )


async def connect_db() -> None:
    global _pool
    _pool = await asyncpg.create_pool(DATABASE_URL, init=_init_connection)
    await _init_db()


async def disconnect_db() -> None:
    global _pool
    if _pool:
        await _pool.close()


def get_db() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool is not initialized")
    return _pool


async def _init_db() -> None:
    query = """
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS datasets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        source_filename TEXT DEFAULT '',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc')
    );

    CREATE TABLE IF NOT EXISTS dataset_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
        name TEXT DEFAULT '',
        email TEXT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'),
        UNIQUE (dataset_id, email)
    );

    CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
        contact_id UUID REFERENCES dataset_contacts(id) ON DELETE SET NULL,
        direction TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        rendered_html TEXT DEFAULT '',
        template_key TEXT DEFAULT '',
        status TEXT DEFAULT 'sent',
        provider_message_id TEXT DEFAULT '',
        thread_key TEXT DEFAULT '',
        reply_received BOOLEAN DEFAULT FALSE,
        reply_content TEXT DEFAULT '',
        reply_summary TEXT DEFAULT '',
        reply_suggestion TEXT DEFAULT '',
        needs_attention BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'),
        last_interaction_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc')
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action TEXT NOT NULL,
        recipient TEXT NOT NULL,
        status TEXT NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc')
    );

    ALTER TABLE datasets ADD COLUMN IF NOT EXISTS source_filename TEXT DEFAULT '';
    ALTER TABLE datasets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc');

    ALTER TABLE dataset_contacts ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
    ALTER TABLE dataset_contacts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc');

    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS rendered_html TEXT DEFAULT '';
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS template_key TEXT DEFAULT '';
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS provider_message_id TEXT DEFAULT '';
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS thread_key TEXT DEFAULT '';
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS reply_received BOOLEAN DEFAULT FALSE;
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS reply_content TEXT DEFAULT '';
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS reply_summary TEXT DEFAULT '';
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS reply_suggestion TEXT DEFAULT '';
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS needs_attention BOOLEAN DEFAULT FALSE;
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc');
    ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc');

    ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc');
    """
    async with get_db().acquire() as conn:
        await conn.execute(query)
