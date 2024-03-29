"""empty message

Revision ID: 033efaccf750
Revises: 
Create Date: 2023-12-05 02:21:06.694890

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '033efaccf750'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('tax_payment', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tax_rate', sa.Float(), nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('tax_payment', schema=None) as batch_op:
        batch_op.drop_column('tax_rate')

    # ### end Alembic commands ###
