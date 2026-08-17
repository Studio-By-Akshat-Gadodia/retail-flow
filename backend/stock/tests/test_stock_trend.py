import pytest
from rest_framework.test import APIClient

from products.models import Product
from stock.services import record_stock_in, record_stock_out


URL = "/api/v1/stock/trend/"
TODAY = "2026-06-14"
YESTERDAY = "2026-06-13"
FUTURE = "2099-01-01"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db, django_user_model):
    return django_user_model.objects.create_user(email="staff@example.com", password="pass")


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
        store=store, name="Bolt", sku="BLT-001",
        category="Hardware", quantity=100, unit_price="1.50",
        reorder_level=5, is_active=True,
    )


# ── Validation ────────────────────────────────────────────────────────────────

class TestStockTrendValidation:
    def test_requires_authentication(self, db, client, store):
        resp = client.get(URL, {"store_id": store.pk, "date_from": TODAY, "date_to": TODAY})
        assert resp.status_code == 401

    def test_missing_store_id_returns_400(self, db, client, user, member):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"date_from": TODAY, "date_to": TODAY})
        assert resp.status_code == 400
        assert "store_id" in resp.data["data"]

    def test_missing_date_from_returns_400(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_to": TODAY})
        assert resp.status_code == 400

    def test_missing_date_to_returns_400(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_from": TODAY})
        assert resp.status_code == 400

    def test_invalid_date_returns_400(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_from": "bad", "date_to": TODAY})
        assert resp.status_code == 400

    def test_non_member_returns_403(self, db, client, store, django_user_model):
        outsider = django_user_model.objects.create_user(email="x@example.com", password="pass")
        client.force_authenticate(user=outsider)
        resp = client.get(URL, {"store_id": store.pk, "date_from": TODAY, "date_to": TODAY})
        assert resp.status_code == 403

    def test_inverted_date_range_returns_400(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_from": TODAY, "date_to": YESTERDAY})
        assert resp.status_code == 400
        assert "date_from" in resp.data["data"]


# ── Data ──────────────────────────────────────────────────────────────────────

class TestStockTrendData:
    def test_response_shape(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_from": TODAY, "date_to": TODAY})
        assert resp.status_code == 200
        assert resp.data["status"] == "success"
        assert "results" in resp.data["data"]

    def test_empty_period_returns_empty_results(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_from": TODAY, "date_to": TODAY})
        assert resp.data["data"]["results"] == []

    def test_groups_in_and_out_by_day(self, db, client, user, member, product):
        record_stock_in(product.pk, 10, user)
        record_stock_out(product.pk, 4, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        results = resp.data["data"]["results"]
        assert len(results) == 1
        day = results[0]
        assert day["stock_in"] == 10
        assert day["stock_out"] == 4
        assert "date" in day

    def test_each_result_has_date_in_and_out(self, db, client, user, member, product):
        record_stock_in(product.pk, 5, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        entry = resp.data["data"]["results"][0]
        assert "date"      in entry
        assert "stock_in"  in entry
        assert "stock_out" in entry

    def test_stock_out_zero_when_only_stock_in(self, db, client, user, member, product):
        record_stock_in(product.pk, 7, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        assert resp.data["data"]["results"][0]["stock_out"] == 0

    def test_stock_in_zero_when_only_stock_out(self, db, client, user, member, product):
        record_stock_out(product.pk, 3, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        assert resp.data["data"]["results"][0]["stock_in"] == 0

    def test_other_store_movements_excluded(self, db, client, user, member, product, django_user_model):
        from stores.models import Store, StoreMember
        other_user = django_user_model.objects.create_user(email="o@example.com", password="pass")
        other_store = Store.objects.create(name="Other", currency="USD", created_by=other_user)
        StoreMember.objects.create(store=other_store, user=other_user, role="owner")
        other_product = Product.objects.create(
            store=other_store, name="Screw", sku="SCR-001",
            category="Hardware", quantity=50, unit_price="0.10",
            reorder_level=2, is_active=True,
        )
        record_stock_in(other_product.pk, 99, other_user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        assert resp.data["data"]["results"] == []

    def test_results_ordered_by_date_ascending(self, db, client, user, member, product):
        record_stock_in(product.pk, 5, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        dates = [r["date"] for r in resp.data["data"]["results"]]
        assert dates == sorted(dates)
