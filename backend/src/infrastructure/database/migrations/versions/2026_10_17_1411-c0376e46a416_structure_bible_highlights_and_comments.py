"""structure bible highlights and comments

Highlights and comments stop storing free text ("Livro C:V - texto do versículo") and store the
reference instead: book slug, chapter and verse (highlights, one row per verse) or verse range
(comments). The verse text is no longer copied per user.

Existing rows are deleted, not converted: when this was written there was no production data
(only local development). Downgrade also deletes rows, since the old free text can't be rebuilt.

Revision ID: c0376e46a416
Revises: 7766b2e0e190
Create Date: 2026-10-17 14:11:40.416311

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c0376e46a416'
down_revision: Union[str, Sequence[str], None] = '7766b2e0e190'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("DELETE FROM bible_comments")
    op.execute("DELETE FROM bible_highlights")
    op.add_column('bible_comments', sa.Column('book', sa.String(), nullable=False))
    op.add_column('bible_comments', sa.Column('chapter', sa.Integer(), nullable=False))
    op.add_column('bible_comments', sa.Column('verse_start', sa.Integer(), nullable=False))
    op.add_column('bible_comments', sa.Column('verse_end', sa.Integer(), nullable=False))
    op.create_index('ix_bible_comments_user_passage', 'bible_comments', ['user_id', 'book', 'chapter'], unique=False)
    op.drop_column('bible_comments', 'biblical_text')
    op.add_column('bible_highlights', sa.Column('book', sa.String(), nullable=False))
    op.add_column('bible_highlights', sa.Column('chapter', sa.Integer(), nullable=False))
    op.add_column('bible_highlights', sa.Column('verse', sa.Integer(), nullable=False))
    op.create_unique_constraint('uq_bible_highlights_user_verse', 'bible_highlights', ['user_id', 'book', 'chapter', 'verse'])
    op.drop_column('bible_highlights', 'text')


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM bible_comments")
    op.execute("DELETE FROM bible_highlights")
    op.add_column('bible_highlights', sa.Column('text', sa.VARCHAR(), autoincrement=False, nullable=False))
    op.drop_constraint('uq_bible_highlights_user_verse', 'bible_highlights', type_='unique')
    op.drop_column('bible_highlights', 'verse')
    op.drop_column('bible_highlights', 'chapter')
    op.drop_column('bible_highlights', 'book')
    op.add_column('bible_comments', sa.Column('biblical_text', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.drop_index('ix_bible_comments_user_passage', table_name='bible_comments')
    op.drop_column('bible_comments', 'verse_end')
    op.drop_column('bible_comments', 'verse_start')
    op.drop_column('bible_comments', 'chapter')
    op.drop_column('bible_comments', 'book')
