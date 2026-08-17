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


def payload(store, **overrides):
    data = {
        "store_id": store.id,
        "name": "Bolt",
        "sku": "BOLT-1",
        "category": "Hardware",
        "quantity": 10,
        "unit_price": "1.50",
        "reorder_level": 5,
    }
    data.update(overrides)
    return data


# ── create ───────────────────────────────────────────────────────────────────

class TestCreateUnitPriceValidation:
    URL = "/api/v1/products/"

    def test_negative_unit_price_rejected(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, payload(store, unit_price="-50.00"), format="json")
        assert resp.status_code == 400
        assert not Product.objects.filter(sku="BOLT-1").exists()

    def test_small_negative_unit_price_rejected(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, payload(store, unit_price="-0.01"), format="json")
        assert resp.status_code == 400

    def test_zero_unit_price_allowed(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, payload(store, unit_price="0.00"), format="json")
        assert resp.status_code == 201

    def test_positive_unit_price_allowed(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.post(self.URL, payload(store), format="json")
        assert resp.status_code == 201


# ── update ───────────────────────────────────────────────────────────────────

class TestUpdateUnitPriceValidation:
    URL = "/api/v1/products/"

    @pytest.fixture
    def product(self, db, store):
        return Product.objects.create(
            store=store, name="Bolt", sku="BOLT-1", category="Hardware",
            quantity=10, unit_price="1.50", reorder_level=5, is_active=True,
        )

    def test_negative_unit_price_rejected(self, db, client, user, member, store, product):
        client.force_authenticate(user=user)
        resp = client.patch(f"{self.URL}{product.id}/", {"unit_price": "-50.00"}, format="json")
        assert resp.status_code == 400
        product.refresh_from_db()
        assert str(product.unit_price) == "1.50"

    def test_positive_unit_price_allowed(self, db, client, user, member, store, product):
        client.force_authenticate(user=user)
        resp = client.patch(f"{self.URL}{product.id}/", {"unit_price": "2.75"}, format="json")
        assert resp.status_code == 200
        product.refresh_from_db()
        assert str(product.unit_price) == "2.75"
