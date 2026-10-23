"""add reading groups

Revision ID: 8b1c4d2e9f03
Revises: 5fada62e857e
Create Date: 2026-10-23 19:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b1c4d2e9f03'
down_revision: Union[str, Sequence[str], None] = '5fada62e857e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'reading_groups',
        sa.Column('leader_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('plan_slug', sa.String(), nullable=False),
        sa.Column('book', sa.String(), nullable=True),
        sa.Column('books', sa.JSON(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('total_days', sa.Integer(), nullable=False),
        sa.Column('weekdays', sa.String(), nullable=False),
        sa.Column('meeting_weekday', sa.Integer(), nullable=True),
        sa.Column('invite_token', sa.String(), nullable=True),
        sa.Column('invite_expires_at', sa.DateTime(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['leader_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invite_token'),
    )
    op.create_index(op.f('ix_reading_groups_leader_id'), 'reading_groups', ['leader_id'], unique=False)

    op.create_table(
        'reading_group_members',
        sa.Column('group_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('show_name', sa.Boolean(), nullable=False),
        sa.Column('consent_version', sa.String(), nullable=False),
        sa.Column('consent_at', sa.DateTime(), nullable=False),
        sa.Column('read_ranges', sa.JSON(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['reading_groups.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'user_id', name='uq_reading_group_member'),
    )
    op.create_index(op.f('ix_reading_group_members_group_id'), 'reading_group_members', ['group_id'], unique=False)
    op.create_index(op.f('ix_reading_group_members_user_id'), 'reading_group_members', ['user_id'], unique=False)

    op.create_table(
        'reading_group_notes',
        sa.Column('group_id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=False),
        sa.Column('day_index', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(), nullable=False),
        sa.Column('study_id', sa.UUID(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['group_id'], ['reading_groups.id']),
        sa.ForeignKeyConstraint(['study_id'], ['studies.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'day_index', name='uq_reading_group_note_day'),
    )
    op.create_index(op.f('ix_reading_group_notes_group_id'), 'reading_group_notes', ['group_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_reading_group_notes_group_id'), table_name='reading_group_notes')
    op.drop_table('reading_group_notes')
    op.drop_index(op.f('ix_reading_group_members_user_id'), table_name='reading_group_members')
    op.drop_index(op.f('ix_reading_group_members_group_id'), table_name='reading_group_members')
    op.drop_table('reading_group_members')
    op.drop_index(op.f('ix_reading_groups_leader_id'), table_name='reading_groups')
    op.drop_table('reading_groups')
