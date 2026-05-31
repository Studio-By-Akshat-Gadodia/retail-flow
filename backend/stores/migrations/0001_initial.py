from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Store",
            fields=[
                ("id",          models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name",        models.CharField(max_length=255)),
                ("slug",        models.SlugField(blank=True, max_length=255, unique=True)),
                ("description", models.TextField(blank=True)),
                ("currency",    models.CharField(default="USD", max_length=3)),
                ("timezone",    models.CharField(default="UTC", max_length=50)),
                ("is_active",   models.BooleanField(default=True)),
                ("created_at",  models.DateTimeField(auto_now_add=True)),
                ("updated_at",  models.DateTimeField(auto_now=True)),
                ("created_by",  models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="created_stores",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="StoreMember",
            fields=[
                ("id",        models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role",      models.CharField(
                    max_length=30,
                    choices=[
                        ("owner",             "Owner"),
                        ("admin",             "Admin"),
                        ("manager",           "Manager"),
                        ("inventory_manager", "Inventory Manager"),
                        ("cashier",           "Cashier"),
                        ("viewer",            "Viewer"),
                    ],
                )),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("store",     models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="members",
                    to="stores.store",
                )),
                ("user",      models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="store_memberships",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("invited_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="sent_invitations",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["joined_at"], "unique_together": {("store", "user")}},
        ),
    ]
