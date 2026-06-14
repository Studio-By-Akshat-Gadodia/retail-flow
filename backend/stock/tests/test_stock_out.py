import pytest
from rest_framework.test import APIClient

from products.models import Product
from stock.models import StockMovement
from stock.services import record_stock_out, InsufficientStockError


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db, django_user_model):
    return django_user_model.objects.create_user(
        email="staff@example.com",
        password="pass",
    )


@pytest.fixture
def store(db, user):
    from stores.models import Store
    return Store.objects.create(name="Test Store", currency="USD", created_by=user)


@pytest.fixture
def member(db, store, user):
    from stores.models import StoreMember
    return StoreMember.objects.create(store=store, user=user, role="admin")


@pytest.fixture
def product(db, store):
    return Product.objects.create(
        store=store,
        name="Bolt",
        sku="BLT-001",
        category="Hardware",
        quantity=10,
        unit_price="1.50",
        reorder_level=5,
        is_active=True,
    )


# ── Service layer ──────────────────────────────────────────────────────────────

class TestRecordStockOut:
    def test_decreases_product_quantity(self, db, product, user):
        record_stock_out(product.pk, 4, user)
        product.refresh_from_db()
        assert product.quantity == 6

    def test_creates_stock_movement(self, db, product, user):
        movement = record_stock_out(product.pk, 3, user)
        assert movement.movement_type == StockMovement.STOCK_OUT
        assert movement.quantity == 3
        assert movement.performed_by == user
        assert movement.product == product

    def test_notes_are_stored(self, db, product, user):
        movement = record_stock_out(product.pk, 1, user, notes="Damaged goods")
        assert movement.notes == "Damaged goods"

    def test_exact_quantity_allowed(self, db, product, user):
        record_stock_out(product.pk, 10, user)
        product.refresh_from_db()
        assert product.quantity == 0

    def test_raises_when_quantity_exceeds_stock(self, db, product, user):
        with pytest.raises(InsufficientStockError):
            record_stock_out(product.pk, 11, user)

    def test_quantity_unchanged_on_insufficient_stock(self, db, product, user):
        try:
            record_stock_out(product.pk, 99, user)
        except InsufficientStockError:
            pass
        product.refresh_from_db()
        assert product.quantity == 10

    def test_raises_for_inactive_product(self, db, product, user):
        product.is_active = False
        product.save()
        with pytest.raises(Product.DoesNotExist):
            record_stock_out(product.pk, 1, user)


# ── API endpoint ───────────────────────────────────────────────────────────────

class TestStockOutEndpoint:
    URL = "/api/v1/stock/out/"

    def test_requires_authentication(self, db, client, product):
        resp = client.post(self.URL, {"product_id": product.pk, "quantity": 1})
        assert resp.status_code == 401

    def test_success(self, db, client, user, member, product):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, {"product_id": product.pk, "quantity": 3})
        assert resp.status_code == 201
        assert resp.data["status"] == "success"
        product.refresh_from_db()
        assert product.quantity == 7

    def test_quantity_must_be_positive(self, db, client, user, member, product):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, {"product_id": product.pk, "quantity": 0})
        assert resp.status_code == 400
        assert resp.data["status"] == "failed"

    def test_blocks_overdraft(self, db, client, user, member, product):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, {"product_id": product.pk, "quantity": 11})
        assert resp.status_code == 400
        assert resp.data["status"] == "failed"

    def test_quantity_unchanged_after_blocked_overdraft(self, db, client, user, member, product):
        client.force_authenticate(user=user)
        client.post(self.URL, {"product_id": product.pk, "quantity": 99})
        product.refresh_from_db()
        assert product.quantity == 10

    def test_non_member_cannot_stock_out(self, db, client, product, django_user_model):
        other = django_user_model.objects.create_user(email="other@example.com", password="pass")
        client.force_authenticate(user=other)
        resp = client.post(self.URL, {"product_id": product.pk, "quantity": 1})
        assert resp.status_code == 400
        assert resp.data["status"] == "failed"

    def test_response_contains_movement_fields(self, db, client, user, member, product):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, {"product_id": product.pk, "quantity": 2})
        data = resp.data["data"]
        assert data["quantity"] == 2
        assert data["movement_type"] == StockMovement.STOCK_OUT
