from django.contrib import admin
from stores.models import Store, StoreMember


class StoreMemberInline(admin.TabularInline):
    model = StoreMember
    extra = 0
    autocomplete_fields = ["user"]
    fields = ("user", "role", "invited_by", "joined_at")
    readonly_fields = ("joined_at",)


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display  = ("name", "slug", "currency", "is_active", "created_by", "created_at")
    list_filter   = ("is_active", "currency")
    search_fields = ("name", "slug")
    readonly_fields = ("slug", "created_at", "updated_at")
    inlines = [StoreMemberInline]


@admin.register(StoreMember)
class StoreMemberAdmin(admin.ModelAdmin):
    list_display  = ("user", "store", "role", "invited_by", "joined_at")
    list_filter   = ("role",)
    search_fields = ("user__email", "store__name")
    autocomplete_fields = ["user", "store"]
