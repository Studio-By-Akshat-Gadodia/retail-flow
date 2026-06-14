from django.db import migrations


def deduplicate_stores(apps, schema_editor):
    """Hard-delete duplicate stores (and their members) keeping the oldest
    per (lower(name), created_by_id). Uses raw SQL to avoid ORM FK triggers."""
    schema_editor.execute("""
        DELETE FROM stores_storemember
        WHERE store_id IN (
            SELECT id FROM stores_store
            WHERE id NOT IN (
                SELECT DISTINCT ON (lower(name), created_by_id) id
                FROM stores_store
                ORDER BY lower(name), created_by_id, id ASC
            )
        )
    """)
    schema_editor.execute("""
        DELETE FROM stores_store
        WHERE id NOT IN (
            SELECT DISTINCT ON (lower(name), created_by_id) id
            FROM stores_store
            ORDER BY lower(name), created_by_id, id ASC
        )
    """)


class Migration(migrations.Migration):
    # Must be non-atomic: the dedup DML and the DDL need separate transactions
    # on PostgreSQL to avoid "pending trigger events" errors.
    atomic = False

    dependencies = [
        ("stores", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(deduplicate_stores, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name="store",
            unique_together={("name", "created_by")},
        ),
    ]
