from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower


class Product(models.Model):
    store         = models.ForeignKey("stores.Store", on_delete=models.CASCADE, related_name="products")
    name          = models.CharField(max_length=255)
    sku           = models.CharField(max_length=100)
    category      = models.CharField(max_length=100)
    quantity      = models.PositiveIntegerField(default=0)
    unit_price    = models.DecimalField(max_digits=12, decimal_places=2)
    reorder_level = models.PositiveIntegerField(default=0)
    is_active     = models.BooleanField(default=True)
    created_by    = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_products",
    )
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            # SKUs are barcode / hand-typed identifiers, so case must not create a
            # distinct record. Scoped to active products so a soft-deleted SKU can
            # be reused — the same rule the API serializers enforce.
            models.UniqueConstraint(
                Lower("sku"),
                "store",
                condition=Q(is_active=True),
                name="uniq_active_sku_per_store_ci",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"
