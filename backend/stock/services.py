from django.db import transaction

from products.models import Product
from stock.models import StockMovement


class InsufficientStockError(Exception):
    pass


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


@transaction.atomic
def record_stock_out(product_id: int, quantity: int, user, notes: str = "") -> StockMovement:
    product = Product.objects.select_for_update().get(pk=product_id, is_active=True)
    if product.quantity < quantity:
        raise InsufficientStockError(
            f"Only {product.quantity} unit(s) available; cannot remove {quantity}."
        )
    product.quantity -= quantity
    product.save()
    return StockMovement.objects.create(
        product=product,
        movement_type=StockMovement.STOCK_OUT,
        quantity=quantity,
        notes=notes,
        performed_by=user,
    )
