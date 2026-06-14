from django.db import transaction

from products.models import Product
from stock.models import StockMovement


@transaction.atomic
def record_stock_in(product_id: int, quantity: int, user, notes: str = "") -> StockMovement:
    product = Product.objects.select_for_update().get(pk=product_id, is_active=True)
    product.quantity += quantity
    product.save()
    return StockMovement.objects.create(
        product=product,
        movement_type=StockMovement.STOCK_IN,
        quantity=quantity,
        notes=notes,
        performed_by=user,
    )
