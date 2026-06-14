from django.db import models


class StockMovement(models.Model):
    STOCK_IN  = "stock_in"
    STOCK_OUT = "stock_out"
    TYPE_CHOICES = [
        (STOCK_IN,  "Stock In"),
        (STOCK_OUT, "Stock Out"),
    ]

    product       = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="stock_movements",
    )
    movement_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=STOCK_IN)
    quantity      = models.PositiveIntegerField()
    notes         = models.CharField(max_length=500, blank=True)
    performed_by  = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="stock_movements",
    )
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type} +{self.quantity} × {self.product.name}"
