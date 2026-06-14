import pytest
from rest_framework.test import APIClient

from products.models import Product


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db, django_user_model):
    return django_user_model.objects.create_user(email="owner@example.com", password="pass")


@pytest.fixture
def store(db, user):
    from stores.models import Store
    return Store.objects.create(name="Test Store", currency="USD", created_by=user)


@pytest.fixture
def member(db, store, user):
    from stores.models import StoreMember
    return StoreMember.objects.create(store=store, user=user, role="admin")


def make_product(store, name, quantity, reorder_level, sku=None):
    return Product.objects.create(
        store=store,
        name=name,
        sku=sku or name[:10].upper(),
        category="General",
        quantity=quantity,
        unit_price="1.00",
        reorder_level=reorder_level,
        is_active=True,
    )


# ── is_low_stock field ────────────────────────────────────────────────────────

class TestIsLowStockField:
    URL = "/api/v1/products/"

    def test_field_true_when_qty_below_reorder(self, db, client, user, member, store):
        make_product(store, "Bolt",  quantity=3, reorder_level=5)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"][0]["is_low_stock"] is True

    def test_field_true_when_qty_equals_reorder(self, db, client, user, member, store):
        make_product(store, "Nut", quantity=5, reorder_level=5)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"][0]["is_low_stock"] is True

    def test_field_false_when_qty_above_reorder(self, db, client, user, member, store):
        make_product(store, "Screw", quantity=6, reorder_level=5)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"][0]["is_low_stock"] is False

    def test_field_false_when_reorder_level_zero_and_qty_positive(self, db, client, user, member, store):
        make_product(store, "Widget", quantity=1, reorder_level=0)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"][0]["is_low_stock"] is False

    def test_field_true_when_both_zero(self, db, client, user, member, store):
        make_product(store, "Empty", quantity=0, reorder_level=0)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"][0]["is_low_stock"] is True


# ── ?low_stock=true filter ────────────────────────────────────────────────────

class TestLowStockFilter:
    URL = "/api/v1/products/"

    def _setup_products(self, store):
        make_product(store, "Low A",  quantity=2,  reorder_level=5,  sku="LOW-A")
        make_product(store, "Low B",  quantity=5,  reorder_level=5,  sku="LOW-B")
        make_product(store, "OK C",   quantity=10, reorder_level=5,  sku="OK-C")
        make_product(store, "OK D",   quantity=1,  reorder_level=0,  sku="OK-D")

    def test_returns_only_low_stock_products(self, db, client, user, member, store):
        self._setup_products(store)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id, "low_stock": "true"})
        names = [p["name"] for p in resp.data["data"]]
        assert "Low A" in names
        assert "Low B" in names
        assert "OK C" not in names
        assert "OK D" not in names

    def test_all_returned_products_have_is_low_stock_true(self, db, client, user, member, store):
        self._setup_products(store)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id, "low_stock": "true"})
        assert all(p["is_low_stock"] for p in resp.data["data"])

    def test_without_filter_returns_all_products(self, db, client, user, member, store):
        self._setup_products(store)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert len(resp.data["data"]) == 4

    def test_empty_when_no_low_stock_products(self, db, client, user, member, store):
        make_product(store, "Fine", quantity=10, reorder_level=5)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id, "low_stock": "true"})
        assert resp.data["data"] == []
