"""fix schema add missing columns and FKs

Revision ID: 1b2b0c5e8baa
Revises: 36c1750df49a
Create Date: 2026-09-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1b2b0c5e8baa'
down_revision = '36c1750df49a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Drop legacy tables that have no corresponding models
    op.execute('DROP TABLE IF EXISTS books CASCADE')
    op.execute('DROP TABLE IF EXISTS reservations CASCADE')

    # 2. Add missing columns (safe to skip if already present)
    op.execute('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status VARCHAR(50) NULL')
    op.execute("ALTER TABLE lifts ADD COLUMN IF NOT EXISTS direction VARCHAR(50) NOT NULL DEFAULT 'idle'")

    # 3. Add missing foreign key on issues.cluster_id
    op.execute('ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_cluster_id_fkey')
    op.execute('ALTER TABLE issues ADD CONSTRAINT issues_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES issue_clusters(id)')


def downgrade() -> None:
    op.execute('ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_cluster_id_fkey')
    op.execute('ALTER TABLE lifts DROP COLUMN IF EXISTS direction')
    op.execute('ALTER TABLE rooms DROP COLUMN IF EXISTS status')
    
    op.execute('''
        CREATE TABLE books (
            id INTEGER NOT NULL PRIMARY KEY,
            isbn VARCHAR(20) NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            status VARCHAR(50) NOT NULL DEFAULT 'available',
            location_shelf VARCHAR(50),
            total_copies INTEGER NOT NULL DEFAULT 1,
            available_copies INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    ''')
    op.execute('CREATE INDEX ix_books_isbn ON books(isbn)')
    
    op.execute('''
        CREATE TABLE reservations (
            id INTEGER NOT NULL PRIMARY KEY,
            book_id INTEGER NOT NULL REFERENCES books(id),
            user_id UUID NOT NULL REFERENCES users(id),
            reserved_at TIMESTAMP,
            due_date TIMESTAMP NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'active'
        )
    ''')
