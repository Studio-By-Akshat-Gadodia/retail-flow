from django.db import models
from django.utils.text import slugify


class StoreRole(models.TextChoices):
    OWNER             = "owner",             "Owner"
    ADMIN             = "admin",             "Admin"
    MANAGER           = "manager",           "Manager"
    INVENTORY_MANAGER = "inventory_manager", "Inventory Manager"
    CASHIER           = "cashier",           "Cashier"
    VIEWER            = "viewer",            "Viewer"


# Numeric level — higher = more access
ROLE_LEVEL: dict[str, int] = {
    StoreRole.OWNER:             50,
    StoreRole.ADMIN:             40,
    StoreRole.MANAGER:           30,
    StoreRole.INVENTORY_MANAGER: 20,
    StoreRole.CASHIER:           10,
    StoreRole.VIEWER:            0,
}


class Store(models.Model):
    name        = models.CharField(max_length=255)
    slug        = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    currency    = models.CharField(max_length=3, default="USD")
    timezone    = models.CharField(max_length=50, default="UTC")
    is_active   = models.BooleanField(default=True)
    created_by  = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="created_stores",
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug, n = base, 1
            while Store.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class StoreMember(models.Model):
    store      = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="members")
    user       = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="store_memberships")
    role       = models.CharField(max_length=30, choices=StoreRole.choices)
    invited_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="sent_invitations",
    )
    joined_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("store", "user")
        ordering = ["joined_at"]

    def __str__(self):
        return f"{self.user.email} @ {self.store.name} [{self.role}]"

    @property
    def role_level(self) -> int:
        return ROLE_LEVEL.get(self.role, -1)
