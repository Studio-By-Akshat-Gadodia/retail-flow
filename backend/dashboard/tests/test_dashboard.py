import pytest
from rest_framework.test import APIClient

from products.models import Product
from stock.services import record_stock_in, record_stock_out


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


def make_product(store, name, quantity, reorder_level, unit_price="10.00", sku=None):
    return Product.objects.create(
        store=store,
        name=name,
        sku=sku or name[:10].upper(),
        category="General",
        quantity=quantity,
        unit_price=unit_price,
        reorder_level=reorder_level,
        is_active=True,
    )


class TestDashboardSummaryEndpoint:
    URL = "/api/v1/dashboard/summary/"

    def test_requires_authentication(self, db, client, store):
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.status_code == 401

    def test_requires_store_id(self, db, client, user, member):
        client.force_authenticate(user=user)
        resp = client.get(self.URL)
        assert resp.status_code == 400
        assert resp.data["status"] == "failed"

    def test_non_member_forbidden(self, db, client, store, django_user_model):
        other = django_user_model.objects.create_user(email="other@example.com", password="pass")
        client.force_authenticate(user=other)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.status_code == 403

    def test_total_products_count(self, db, client, user, member, store):
        make_product(store, "A", quantity=10, reorder_level=5)
        make_product(store, "B", quantity=10, reorder_level=5)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"]["total_products"] == 2

    def test_inactive_products_excluded(self, db, client, user, member, store):
        make_product(store, "A", quantity=10, reorder_level=5)
        inactive = make_product(store, "B", quantity=10, reorder_level=5, sku="B-INACTIVE")
        inactive.is_active = False
        inactive.save()
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"]["total_products"] == 1

    def test_total_inventory_value(self, db, client, user, member, store):
        make_product(store, "A", quantity=10, reorder_level=5, unit_price="2.50")
        make_product(store, "B", quantity=4,  reorder_level=1, unit_price="5.00")
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"]["total_inventory_value"] == "45.00"

    def test_zero_value_when_no_products(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"]["total_inventory_value"] == "0.00"
        assert resp.data["data"]["total_products"] == 0

    def test_low_stock_count(self, db, client, user, member, store):
        make_product(store, "Low",  quantity=2,  reorder_level=5)
        make_product(store, "OK",   quantity=10, reorder_level=5)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"]["low_stock_count"] == 1

    def test_out_of_stock_count(self, db, client, user, member, store):
        make_product(store, "Empty", quantity=0, reorder_level=5)
        make_product(store, "OK",    quantity=10, reorder_level=5)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert resp.data["data"]["out_of_stock_count"] == 1

    def test_recent_activity_reflects_stock_movements(self, db, client, user, member, store):
        product = make_product(store, "Widget", quantity=10, reorder_level=5)
        record_stock_in(product.pk, 5, user, notes="Delivery")
        record_stock_out(product.pk, 2, user, notes="Sale")
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        activity = resp.data["data"]["recent_activity"]
        assert len(activity) == 2
        assert activity[0]["movement_type"] == "stock_out"  # most recent first
        assert activity[0]["product_name"] == "Widget"

    def test_recent_activity_scoped_to_store(self, db, client, user, member, store):
        other_store_product_owner = user
        product = make_product(store, "Widget", quantity=10, reorder_level=5)
        record_stock_in(product.pk, 5, user)

        from stores.models import Store
        other_store = Store.objects.create(
            name="Other Store", currency="USD", created_by=other_store_product_owner
        )
        other_product = make_product(other_store, "Other Widget", quantity=10, reorder_level=5, sku="OTHER-1")
        record_stock_in(other_product.pk, 5, user)

        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        activity = resp.data["data"]["recent_activity"]
        assert len(activity) == 1
        assert activity[0]["product_name"] == "Widget"

    def test_recent_activity_capped_at_ten(self, db, client, user, member, store):
        product = make_product(store, "Widget", quantity=100, reorder_level=5)
        for _ in range(12):
            record_stock_in(product.pk, 1, user)
        client.force_authenticate(user=user)
        resp = client.get(self.URL, {"store_id": store.id})
        assert len(resp.data["data"]["recent_activity"]) == 10
