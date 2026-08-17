import pytest
from django.db import IntegrityError, transaction
from rest_framework.test import APIClient

from products.models import Product


URL = "/api/v1/products/"


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
def other_store(db, user):
    from stores.models import Store, StoreMember
    store = Store.objects.create(name="Second Store", currency="USD", created_by=user)
    StoreMember.objects.create(store=store, user=user, role="admin")
    return store


@pytest.fixture
def member(db, store, user):
    from stores.models import StoreMember
    return StoreMember.objects.create(store=store, user=user, role="admin")


def payload(store, **overrides):
    data = {
        "store_id": store.id,
        "name": "Bolt",
        "sku": "QA-A",
        "category": "Hardware",
        "quantity": 10,
        "unit_price": "1.50",
        "reorder_level": 5,
    }
    data.update(overrides)
    return data


def make_product(store, sku, name="Bolt"):
    return Product.objects.create(
        store=store, name=name, sku=sku, category="Hardware",
        quantity=10, unit_price="1.50", reorder_level=5, is_active=True,
    )


# ── create ───────────────────────────────────────────────────────────────────

class TestCreateSkuUniqueness:
    def test_same_case_duplicate_rejected(self, db, client, user, member, store):
        make_product(store, "QA-A")
        client.force_authenticate(user=user)
        resp = client.post(URL, payload(store, sku="QA-A"), format="json")
        assert resp.status_code == 400
        assert "sku" in resp.data["data"]

    def test_lowercase_duplicate_rejected(self, db, client, user, member, store):
        make_product(store, "QA-A")
        client.force_authenticate(user=user)
        resp = client.post(URL, payload(store, sku="qa-a"), format="json")
        assert resp.status_code == 400
        assert "sku" in resp.data["data"]
        assert Product.objects.filter(store=store).count() == 1

    def test_mixed_case_duplicate_rejected(self, db, client, user, member, store):
        make_product(store, "qa-a")
        client.force_authenticate(user=user)
        resp = client.post(URL, payload(store, sku="Qa-A"), format="json")
        assert resp.status_code == 400
        assert "sku" in resp.data["data"]

    def test_distinct_sku_allowed(self, db, client, user, member, store):
        make_product(store, "QA-A")
        client.force_authenticate(user=user)
        resp = client.post(URL, payload(store, sku="QA-B"), format="json")
        assert resp.status_code == 201

    def test_case_variant_allowed_in_a_different_store(self, db, client, user, member, store, other_store):
        make_product(store, "QA-A")
        client.force_authenticate(user=user)
        resp = client.post(URL, payload(other_store, sku="qa-a"), format="json")
        assert resp.status_code == 201


# ── update ───────────────────────────────────────────────────────────────────

class TestUpdateSkuUniqueness:
    def test_case_variant_of_another_product_rejected(self, db, client, user, member, store):
        make_product(store, "QA-A", name="First")
        target = make_product(store, "QA-B", name="Second")
        client.force_authenticate(user=user)
        resp = client.patch(f"{URL}{target.id}/", {"sku": "qa-a"}, format="json")
        assert resp.status_code == 400
        assert "sku" in resp.data["data"]
        target.refresh_from_db()
        assert target.sku == "QA-B"

    def test_recasing_own_sku_allowed(self, db, client, user, member, store):
        product = make_product(store, "QA-A")
        client.force_authenticate(user=user)
        resp = client.patch(f"{URL}{product.id}/", {"sku": "qa-a"}, format="json")
        assert resp.status_code == 200
        product.refresh_from_db()
        assert product.sku == "qa-a"

    def test_distinct_sku_allowed(self, db, client, user, member, store):
        product = make_product(store, "QA-A")
        client.force_authenticate(user=user)
        resp = client.patch(f"{URL}{product.id}/", {"sku": "QA-C"}, format="json")
        assert resp.status_code == 200


# ── DB constraint ────────────────────────────────────────────────────────────

class TestSkuDatabaseConstraint:
    def test_case_insensitive_duplicate_rejected(self, db, store):
        make_product(store, "QA-A")
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                make_product(store, "qa-a", name="Other")

    def test_soft_deleted_sku_can_be_reused(self, db, client, user, member, store):
        product = make_product(store, "QA-A")
        client.force_authenticate(user=user)
        assert client.delete(f"{URL}{product.id}/").status_code == 204
        resp = client.post(URL, payload(store, sku="qa-a"), format="json")
        assert resp.status_code == 201
