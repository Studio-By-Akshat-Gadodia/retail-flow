import pytest
from rest_framework.test import APIClient

from suppliers.models import Supplier

LIST_URL   = "/api/v1/suppliers/"
DETAIL_URL = lambda pk: f"/api/v1/suppliers/{pk}/"


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db, django_user_model):
    return django_user_model.objects.create_user(email="owner@example.com", password="pass")


@pytest.fixture
def store(db, user):
    from stores.models import Store
    return Store.objects.create(name="My Store", currency="USD", created_by=user)


@pytest.fixture
def member(db, store, user):
    from stores.models import StoreMember
    return StoreMember.objects.create(store=store, user=user, role="admin")


@pytest.fixture
def supplier(db, store, user):
    return Supplier.objects.create(
        store=store, name="ABC Wholesale",
        contact_name="Alice", email="alice@abc.com",
        phone="555-1234", created_by=user,
    )


# ── List ──────────────────────────────────────────────────────────────────────

class TestSupplierList:
    def test_requires_authentication(self, db, client, store):
        resp = client.get(LIST_URL, {"store_id": store.pk})
        assert resp.status_code == 401

    def test_missing_store_id_returns_400(self, db, client, user, member):
        client.force_authenticate(user=user)
        resp = client.get(LIST_URL)
        assert resp.status_code == 400

    def test_non_member_returns_403(self, db, client, store, django_user_model):
        outsider = django_user_model.objects.create_user(email="x@example.com", password="pass")
        client.force_authenticate(user=outsider)
        resp = client.get(LIST_URL, {"store_id": store.pk})
        assert resp.status_code == 403

    def test_returns_active_suppliers(self, db, client, user, member, supplier):
        client.force_authenticate(user=user)
        resp = client.get(LIST_URL, {"store_id": supplier.store_id})
        assert resp.status_code == 200
        assert resp.data["status"] == "success"
        assert len(resp.data["data"]) == 1
        assert resp.data["data"][0]["name"] == "ABC Wholesale"

    def test_inactive_suppliers_excluded(self, db, client, user, member, supplier):
        supplier.is_active = False
        supplier.save()
        client.force_authenticate(user=user)
        resp = client.get(LIST_URL, {"store_id": supplier.store_id})
        assert resp.data["data"] == []

    def test_other_store_suppliers_excluded(self, db, client, user, member, store, supplier, django_user_model):
        from stores.models import Store, StoreMember
        other_user = django_user_model.objects.create_user(email="o@example.com", password="pass")
        other_store = Store.objects.create(name="Other", currency="USD", created_by=other_user)
        StoreMember.objects.create(store=other_store, user=other_user, role="owner")
        Supplier.objects.create(store=other_store, name="Other Co", created_by=other_user)
        client.force_authenticate(user=user)
        resp = client.get(LIST_URL, {"store_id": store.pk})
        assert all(s["store"] == store.pk for s in resp.data["data"])

    def test_response_fields(self, db, client, user, member, supplier):
        client.force_authenticate(user=user)
        resp = client.get(LIST_URL, {"store_id": supplier.store_id})
        s = resp.data["data"][0]
        for field in ("id", "name", "contact_name", "email", "phone", "notes", "created_at"):
            assert field in s


# ── Create ────────────────────────────────────────────────────────────────────

class TestSupplierCreate:
    def test_requires_authentication(self, db, client, store):
        resp = client.post(LIST_URL, {"store_id": store.pk, "name": "New Co"})
        assert resp.status_code == 401

    def test_creates_supplier(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.post(LIST_URL, {
            "store_id": store.pk, "name": "XYZ Supplies",
            "contact_name": "Bob", "email": "bob@xyz.com",
        })
        assert resp.status_code == 201
        assert resp.data["data"]["name"] == "XYZ Supplies"
        assert Supplier.objects.filter(store=store, name="XYZ Supplies").exists()

    def test_created_by_set_to_request_user(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        client.post(LIST_URL, {"store_id": store.pk, "name": "XYZ Supplies"})
        assert Supplier.objects.get(name="XYZ Supplies").created_by == user

    def test_name_required(self, db, client, user, member, store):
        client.force_authenticate(user=user)
        resp = client.post(LIST_URL, {"store_id": store.pk})
        assert resp.status_code == 400
        assert "name" in resp.data["data"]

    def test_duplicate_name_in_same_store_rejected(self, db, client, user, member, supplier):
        client.force_authenticate(user=user)
        resp = client.post(LIST_URL, {"store_id": supplier.store_id, "name": supplier.name})
        assert resp.status_code == 400
        assert "name" in resp.data["data"]

    def test_same_name_allowed_in_different_store(self, db, client, user, django_user_model):
        from stores.models import Store, StoreMember
        other_user = django_user_model.objects.create_user(email="o@example.com", password="pass")
        other_store = Store.objects.create(name="Other", currency="USD", created_by=other_user)
        StoreMember.objects.create(store=other_store, user=other_user, role="owner")
        Supplier.objects.create(store=other_store, name="Shared Name", created_by=other_user)
        # Now create same name in user's own store
        store2 = Store.objects.create(name="My Store 2", currency="USD", created_by=user)
        StoreMember.objects.create(store=store2, user=user, role="owner")
        client.force_authenticate(user=user)
        resp = client.post(LIST_URL, {"store_id": store2.pk, "name": "Shared Name"})
        assert resp.status_code == 201

    def test_non_member_cannot_create(self, db, client, store, django_user_model):
        outsider = django_user_model.objects.create_user(email="x@example.com", password="pass")
        client.force_authenticate(user=outsider)
        resp = client.post(LIST_URL, {"store_id": store.pk, "name": "Sneaky Co"})
        assert resp.status_code == 400


# ── Update ────────────────────────────────────────────────────────────────────

class TestSupplierUpdate:
    def test_requires_authentication(self, db, client, supplier):
        resp = client.patch(DETAIL_URL(supplier.pk), {"name": "New Name"})
        assert resp.status_code == 401

    def test_updates_fields(self, db, client, user, member, supplier):
        client.force_authenticate(user=user)
        resp = client.patch(DETAIL_URL(supplier.pk), {
            "name": "Updated Co",
            "phone": "999-9999",
        })
        assert resp.status_code == 200
        supplier.refresh_from_db()
        assert supplier.name == "Updated Co"
        assert supplier.phone == "999-9999"

    def test_partial_update_leaves_other_fields(self, db, client, user, member, supplier):
        client.force_authenticate(user=user)
        client.patch(DETAIL_URL(supplier.pk), {"phone": "123-4567"})
        supplier.refresh_from_db()
        assert supplier.name == "ABC Wholesale"  # unchanged
        assert supplier.phone == "123-4567"

    def test_duplicate_name_rejected_on_update(self, db, client, user, member, store):
        Supplier.objects.create(store=store, name="Other Co", created_by=user)
        s2 = Supplier.objects.create(store=store, name="Second Co", created_by=user)
        client.force_authenticate(user=user)
        resp = client.patch(DETAIL_URL(s2.pk), {"name": "Other Co"})
        assert resp.status_code == 400

    def test_non_member_cannot_update(self, db, client, supplier, django_user_model):
        outsider = django_user_model.objects.create_user(email="x@example.com", password="pass")
        client.force_authenticate(user=outsider)
        resp = client.patch(DETAIL_URL(supplier.pk), {"name": "Hacked"})
        assert resp.status_code == 403

    def test_updating_inactive_returns_404(self, db, client, user, member, supplier):
        supplier.is_active = False
        supplier.save()
        client.force_authenticate(user=user)
        resp = client.patch(DETAIL_URL(supplier.pk), {"name": "Ghost"})
        assert resp.status_code == 404


# ── Delete ────────────────────────────────────────────────────────────────────

class TestSupplierDelete:
    def test_requires_authentication(self, db, client, supplier):
        resp = client.delete(DETAIL_URL(supplier.pk))
        assert resp.status_code == 401

    def test_soft_deletes_supplier(self, db, client, user, member, supplier):
        client.force_authenticate(user=user)
        resp = client.delete(DETAIL_URL(supplier.pk))
        assert resp.status_code == 204
        supplier.refresh_from_db()
        assert supplier.is_active is False

    def test_deleted_supplier_excluded_from_list(self, db, client, user, member, supplier):
        client.force_authenticate(user=user)
        client.delete(DETAIL_URL(supplier.pk))
        resp = client.get(LIST_URL, {"store_id": supplier.store_id})
        assert resp.data["data"] == []

    def test_non_member_cannot_delete(self, db, client, supplier, django_user_model):
        outsider = django_user_model.objects.create_user(email="x@example.com", password="pass")
        client.force_authenticate(user=outsider)
        resp = client.delete(DETAIL_URL(supplier.pk))
        assert resp.status_code == 403
        supplier.refresh_from_db()
        assert supplier.is_active is True

    def test_deleting_inactive_returns_404(self, db, client, user, member, supplier):
        supplier.is_active = False
        supplier.save()
        client.force_authenticate(user=user)
        resp = client.delete(DETAIL_URL(supplier.pk))
        assert resp.status_code == 404
