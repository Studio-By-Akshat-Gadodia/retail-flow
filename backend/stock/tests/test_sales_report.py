import pytest
from rest_framework.test import APIClient

from products.models import Product
from stock.services import record_stock_in, record_stock_out


URL = "/api/v1/stock/report/"
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


@pytest.fixture
def product2(db, store):
    return Product.objects.create(
        store=store, name="Nut", sku="NUT-001",
        category="Hardware", quantity=100, unit_price="0.75",
        reorder_level=5, is_active=True,
    )


# ── Auth & param validation ───────────────────────────────────────────────────

class TestSalesReportValidation:
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
        assert "date_from" in resp.data["data"]

    def test_missing_date_to_returns_400(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_from": TODAY})
        assert resp.status_code == 400
        assert "date_to" in resp.data["data"]

    def test_invalid_date_format_returns_400(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_from": "not-a-date", "date_to": TODAY})
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

    def test_equal_dates_allowed(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_from": TODAY, "date_to": TODAY})
        assert resp.status_code == 200


# ── Report data ───────────────────────────────────────────────────────────────

class TestSalesReportData:
    def test_response_shape(self, db, client, user, member, product):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": TODAY, "date_to": TODAY})
        assert resp.status_code == 200
        assert resp.data["status"] == "success"
        data = resp.data["data"]
        assert "date_from" in data
        assert "date_to" in data
        assert "total_quantity_sold" in data
        assert "results" in data

    def test_aggregates_stock_out_by_product(self, db, client, user, member, product):
        record_stock_out(product.pk, 5, user)
        record_stock_out(product.pk, 3, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        data = resp.data["data"]
        assert data["total_quantity_sold"] == 8
        assert len(data["results"]) == 1
        assert data["results"][0]["product_name"] == "Bolt"
        assert data["results"][0]["product_sku"] == "BLT-001"
        assert data["results"][0]["quantity_sold"] == 8

    def test_stock_in_movements_excluded(self, db, client, user, member, product):
        record_stock_in(product.pk, 20, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        assert resp.data["data"]["total_quantity_sold"] == 0
        assert resp.data["data"]["results"] == []

    def test_multiple_products_each_summed(self, db, client, user, member, product, product2):
        record_stock_out(product.pk,  10, user)
        record_stock_out(product2.pk,  4, user)
        record_stock_out(product.pk,   6, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        data = resp.data["data"]
        assert data["total_quantity_sold"] == 20
        by_id = {r["product_id"]: r for r in data["results"]}
        assert by_id[product.pk]["quantity_sold"] == 16
        assert by_id[product2.pk]["quantity_sold"] == 4

    def test_results_ordered_by_quantity_desc(self, db, client, user, member, product, product2):
        record_stock_out(product.pk,  2, user)
        record_stock_out(product2.pk, 9, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        quantities = [r["quantity_sold"] for r in resp.data["data"]["results"]]
        assert quantities == sorted(quantities, reverse=True)

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
        record_stock_out(other_product.pk, 10, other_user)
        record_stock_out(product.pk, 3, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": product.store_id, "date_from": YESTERDAY, "date_to": FUTURE})
        assert resp.data["data"]["total_quantity_sold"] == 3

    def test_empty_period_returns_zero_total(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(URL, {"store_id": store.pk, "date_from": TODAY, "date_to": TODAY})
        data = resp.data["data"]
        assert data["total_quantity_sold"] == 0
        assert data["results"] == []


# ── CSV export ────────────────────────────────────────────────────────────────

class TestSalesReportCsv:
    def test_csv_content_type(self, db, client, user, member, product):
        record_stock_out(product.pk, 7, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {
            "store_id": product.store_id,
            "date_from": YESTERDAY, "date_to": FUTURE,
            "export": "csv",
        })
        assert resp.status_code == 200
        assert "text/csv" in resp["Content-Type"]

    def test_csv_filename(self, db, client, user, member, product):
        client.force_authenticate(user=user)
        resp = client.get(URL, {
            "store_id": product.store_id,
            "date_from": YESTERDAY, "date_to": FUTURE,
            "export": "csv",
        })
        assert YESTERDAY in resp["Content-Disposition"]
        assert FUTURE in resp["Content-Disposition"]

    def test_csv_contains_header_and_rows(self, db, client, user, member, product):
        record_stock_out(product.pk, 5, user)
        client.force_authenticate(user=user)
        resp = client.get(URL, {
            "store_id": product.store_id,
            "date_from": YESTERDAY, "date_to": FUTURE,
            "export": "csv",
        })
        content = resp.content.decode()
        lines = [l for l in content.strip().splitlines() if l]
        assert lines[0] == "Product Name,SKU,Quantity Sold"
        assert "Bolt" in lines[1]
        assert "BLT-001" in lines[1]
        assert "5" in lines[1]
