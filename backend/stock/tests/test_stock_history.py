import pytest
from rest_framework.test import APIClient

from products.models import Product
from stock.models import StockMovement
from stock.services import record_stock_in, record_stock_out


URL = "/api/v1/stock/history/"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db, django_user_model):
    return django_user_model.objects.create_user(
        email="staff@example.com",
        password="pass",
        first_name="Alice",
        last_name="Smith",
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
        quantity=50,
        unit_price="1.50",
        reorder_level=5,
        is_active=True,
    )


@pytest.fixture
def product2(db, store):
    return Product.objects.create(
        store=store,
        name="Nut",
        sku="NUT-001",
        category="Hardware",
        quantity=30,
        unit_price="0.75",
        reorder_level=5,
        is_active=True,
    )


# ── Auth & membership ─────────────────────────────────────────────────────────

class TestStockHistoryAuth:
    def test_requires_authentication(self, db, client, store):
        resp = client.get(URL, {"store_id": store.pk})
        assert resp.status_code == 401

    def test_missing_store_id_returns_400(self, db, client, user, member):
        client.force_authenticate(user=user)
        resp = client.get(URL)
        assert resp.status_code == 400
        assert resp.data["status"] == "failed"

    def test_non_member_returns_403(self, db, client, store, django_user_model):
        outsider = django_user_model.objects.create_user(email="x@example.com", password="pass")
        client.force_authenticate(user=outsider)
        resp = client.get(URL, {"store_id": store.pk})
        assert resp.status_code == 403
        assert resp.data["status"] == "failed"


# ── Basic listing ─────────────────────────────────────────────────────────────

class TestStockHistoryList:
    def test_returns_movements_for_store(self, db, client, user, member, product):
        record_stock_in(product.pk, 10, user)
        record_stock_out(product.pk, 3, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id})
        assert resp.status_code == 200
        assert resp.data["status"] == "success"
        assert len(resp.data["data"]) == 2

    def test_movements_from_other_stores_excluded(self, db, client, user, member, product, django_user_model):
        from stores.models import Store, StoreMember
        other_user = django_user_model.objects.create_user(email="o@example.com", password="pass")
        other_store = Store.objects.create(name="Other Store", currency="USD", created_by=other_user)
        StoreMember.objects.create(store=other_store, user=other_user, role="owner")
        other_product = Product.objects.create(
            store=other_store, name="Screw", sku="SCR-001",
            category="Hardware", quantity=20, unit_price="0.10",
            reorder_level=2, is_active=True,
        )
        record_stock_in(other_product.pk, 5, other_user)
        record_stock_in(product.pk, 10, user)

        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id})
        results = resp.data["data"]
        assert all(r["product"] == product.pk for r in results)

    def test_response_shape(self, db, client, user, member, product):
        record_stock_in(product.pk, 5, user, notes="Delivery")
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id})
        entry = resp.data["data"][0]
        assert entry["product_name"] == "Bolt"
        assert entry["product_sku"] == "BLT-001"
        assert entry["performed_by_name"] == "Alice Smith"
        assert entry["movement_type"] == StockMovement.STOCK_IN
        assert entry["quantity"] == 5
        assert entry["notes"] == "Delivery"

    def test_performed_by_name_falls_back_to_email(self, db, client, store, django_user_model):
        from stores.models import StoreMember
        nameless = django_user_model.objects.create_user(email="nameless@example.com", password="pass")
        StoreMember.objects.create(store=store, user=nameless, role="viewer")
        product = Product.objects.create(
            store=store, name="Pin", sku="PIN-001",
            category="Hardware", quantity=10, unit_price="0.05",
            reorder_level=2, is_active=True,
        )
        record_stock_in(product.pk, 1, nameless)
        client.force_authenticate(user=nameless)
        resp = client.get(URL, {"store_id": store.pk})
        assert resp.data["data"][0]["performed_by_name"] == "nameless@example.com"


# ── Filters ───────────────────────────────────────────────────────────────────

class TestStockHistoryFilters:
    def test_filter_by_product_id(self, db, client, user, member, product, product2):
        record_stock_in(product.pk, 5, user)
        record_stock_in(product2.pk, 3, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "product_id": product.pk})
        results = resp.data["data"]
        assert len(results) == 1
        assert results[0]["product"] == product.pk

    def test_filter_by_movement_type_stock_in(self, db, client, user, member, product):
        record_stock_in(product.pk, 10, user)
        record_stock_out(product.pk, 2, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "movement_type": "stock_in"})
        results = resp.data["data"]
        assert all(r["movement_type"] == StockMovement.STOCK_IN for r in results)
        assert len(results) == 1

    def test_filter_by_movement_type_stock_out(self, db, client, user, member, product):
        record_stock_in(product.pk, 10, user)
        record_stock_out(product.pk, 2, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "movement_type": "stock_out"})
        results = resp.data["data"]
        assert all(r["movement_type"] == StockMovement.STOCK_OUT for r in results)
        assert len(results) == 1

    def test_invalid_movement_type_returns_all(self, db, client, user, member, product):
        record_stock_in(product.pk, 10, user)
        record_stock_out(product.pk, 2, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "movement_type": "garbage"})
        assert len(resp.data["data"]) == 2

    def test_filter_date_from(self, db, client, user, member, product):
        movement = record_stock_in(product.pk, 5, user)
        date_str = movement.created_at.date().isoformat()
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": date_str})
        assert len(resp.data["data"]) >= 1

    def test_filter_date_to(self, db, client, user, member, product):
        movement = record_stock_in(product.pk, 5, user)
        date_str = movement.created_at.date().isoformat()
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_to": date_str})
        assert len(resp.data["data"]) >= 1


# ── Pagination ────────────────────────────────────────────────────────────────

class TestStockHistoryPagination:
    def test_paginated_response_shape(self, db, client, user, member, product):
        for _ in range(3):
            record_stock_in(product.pk, 1, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "page": 1, "page_size": 2})
        assert resp.status_code == 200
        data = resp.data["data"]
        assert "total_count" in data
        assert "total_pages" in data
        assert "current_page" in data
        assert "page_size" in data
        assert "results" in data
        assert data["total_count"] == 3
        assert data["page_size"] == 2
        assert len(data["results"]) == 2

    def test_without_pagination_params_returns_full_list(self, db, client, user, member, product):
        for _ in range(3):
            record_stock_in(product.pk, 1, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id})
        assert isinstance(resp.data["data"], list)
        assert len(resp.data["data"]) == 3
