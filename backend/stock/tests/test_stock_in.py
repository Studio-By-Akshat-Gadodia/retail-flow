import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from products.models import Product
from stock.models import StockMovement
from stock.services import record_stock_in


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

class TestRecordStockIn:
    def test_increases_product_quantity(self, db, product, user):
        record_stock_in(product.pk, 5, user)
        product.refresh_from_db()
        assert product.quantity == 15

    def test_creates_stock_movement(self, db, product, user):
        movement = record_stock_in(product.pk, 5, user)
        assert movement.movement_type == StockMovement.STOCK_IN
        assert movement.quantity == 5
        assert movement.performed_by == user
        assert movement.product == product

    def test_notes_are_stored(self, db, product, user):
        movement = record_stock_in(product.pk, 3, user, notes="Delivery from supplier")
        assert movement.notes == "Delivery from supplier"

    def test_raises_for_inactive_product(self, db, product, user):
        product.is_active = False
        product.save()
        with pytest.raises(Product.DoesNotExist):
            record_stock_in(product.pk, 1, user)


# ── API endpoint ───────────────────────────────────────────────────────────────

class TestStockInEndpoint:
    URL = "/api/v1/stock/in/"

    def test_requires_authentication(self, db, client, product):
        resp = client.post(self.URL, {"product_id": product.pk, "quantity": 1})
        assert resp.status_code == 401

    def test_success(self, db, client, user, member, product):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, {"product_id": product.pk, "quantity": 7})
        assert resp.status_code == 201
        assert resp.data["status"] == "success"
        product.refresh_from_db()
        assert product.quantity == 17

    def test_quantity_must_be_positive(self, db, client, user, member, product):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, {"product_id": product.pk, "quantity": 0})
        assert resp.status_code == 400
        assert resp.data["status"] == "failed"

    def test_non_member_cannot_stock_in(self, db, client, product, django_user_model):
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
        assert data["movement_type"] == StockMovement.STOCK_IN
