from django.db import models


class Supplier(models.Model):
    store        = models.ForeignKey("stores.Store", on_delete=models.CASCADE, related_name="suppliers")
    name         = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True)
    email        = models.EmailField(blank=True)
    phone        = models.CharField(max_length=50, blank=True)
    notes        = models.CharField(max_length=500, blank=True)
    is_active    = models.BooleanField(default=True)
    created_by   = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_suppliers",
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering        = ["name"]
        unique_together = [("store", "name")]

    def __str__(self):
        return self.name
