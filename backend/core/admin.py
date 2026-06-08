from django.contrib import admin
from unfold.admin import ModelAdmin


class BaseModelAdmin(ModelAdmin):
    """Project-wide ModelAdmin base. Every admin registration should inherit from this
    (or, for the User model, from ``unfold.admin.UserAdmin``).

    - Extends ``unfold.admin.ModelAdmin`` so every change page picks up the Unfold theme.
    - Exposes BaseModel's audit fields as read-only.
    - Sensible list pagination.
    """

    list_per_page  = 25
    readonly_fields = ('created_at', 'updated_at')
