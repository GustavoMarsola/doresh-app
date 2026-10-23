"""add reading group mural (shared annotations, replies, reports)

Revision ID: c4e7a9b1d2f5
Revises: 8b1c4d2e9f03
Create Date: 2026-10-23 20:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e7a9b1d2f5'
down_revision: Union[str, Sequence[str], None] = '8b1c4d2e9f03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'reading_group_shares',
        sa.Column('group_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('kind', sa.String(), nullable=False),
        sa.Column('comment_id', sa.UUID(), nullable=True),
        sa.Column('book', sa.String(), nullable=False),
        sa.Column('chapter', sa.Integer(), nullable=False),
        sa.Column('verse_start', sa.Integer(), nullable=False),
        sa.Column('verse_end', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(), nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('hidden_at', sa.DateTime(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['comment_id'], ['bible_comments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['group_id'], ['reading_groups.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_reading_group_shares_group_id'), 'reading_group_shares', ['group_id'], unique=False)
    op.create_index(op.f('ix_reading_group_shares_user_id'), 'reading_group_shares', ['user_id'], unique=False)
    op.create_index('ix_reading_group_shares_passage', 'reading_group_shares', ['group_id', 'book', 'chapter'], unique=False)

    op.create_table(
        'reading_group_share_replies',
        sa.Column('share_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('text', sa.String(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['share_id'], ['reading_group_shares.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_reading_group_share_replies_share_id'), 'reading_group_share_replies', ['share_id'], unique=False)
    op.create_index(op.f('ix_reading_group_share_replies_user_id'), 'reading_group_share_replies', ['user_id'], unique=False)

    op.create_table(
        'reading_group_share_reports',
        sa.Column('share_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['share_id'], ['reading_group_shares.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('share_id', 'user_id', name='uq_reading_group_share_report'),
    )
    op.create_index(op.f('ix_reading_group_share_reports_share_id'), 'reading_group_share_reports', ['share_id'], unique=False)
    op.create_index(op.f('ix_reading_group_share_reports_user_id'), 'reading_group_share_reports', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_reading_group_share_reports_user_id'), table_name='reading_group_share_reports')
    op.drop_index(op.f('ix_reading_group_share_reports_share_id'), table_name='reading_group_share_reports')
    op.drop_table('reading_group_share_reports')
    op.drop_index(op.f('ix_reading_group_share_replies_user_id'), table_name='reading_group_share_replies')
    op.drop_index(op.f('ix_reading_group_share_replies_share_id'), table_name='reading_group_share_replies')
    op.drop_table('reading_group_share_replies')
    op.drop_index('ix_reading_group_shares_passage', table_name='reading_group_shares')
    op.drop_index(op.f('ix_reading_group_shares_user_id'), table_name='reading_group_shares')
    op.drop_index(op.f('ix_reading_group_shares_group_id'), table_name='reading_group_shares')
    op.drop_table('reading_group_shares')
