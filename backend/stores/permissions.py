from rest_framework.permissions import BasePermission, SAFE_METHODS
from stores.models import StoreMember, StoreRole, ROLE_LEVEL


def _member_level(user, store_pk) -> int:
    """Return the role level of user in the given store, or -1 if not a member."""
    try:
        m = StoreMember.objects.get(store_id=store_pk, user=user)
        return ROLE_LEVEL.get(m.role, -1)
    except StoreMember.DoesNotExist:
        return -1


def _store_pk(view):
    return view.kwargs.get("store_pk") or view.kwargs.get("pk")


class IsStoreMember(BasePermission):
    """Any member of the store (any role)."""
    message = "You are not a member of this store."

    def has_permission(self, request, view):
        return _member_level(request.user, _store_pk(view)) >= 0


class IsStoreAdmin(BasePermission):
    """Reads: any member. Writes: admin or owner."""
    message = "You need admin or owner access for this action."

    def has_permission(self, request, view):
        level = _member_level(request.user, _store_pk(view))
        if request.method in SAFE_METHODS:
            return level >= 0
        return level >= ROLE_LEVEL[StoreRole.ADMIN]


class IsStoreManager(BasePermission):
    """Reads: any member. Writes: manager, admin, or owner."""
    message = "You need at least manager access for this action."

    def has_permission(self, request, view):
        level = _member_level(request.user, _store_pk(view))
        if request.method in SAFE_METHODS:
            return level >= 0
        return level >= ROLE_LEVEL[StoreRole.MANAGER]


class IsStoreOwner(BasePermission):
    """Owner-only (e.g. delete store, transfer ownership)."""
    message = "Only the store owner can perform this action."

    def has_permission(self, request, view):
        return _member_level(request.user, _store_pk(view)) >= ROLE_LEVEL[StoreRole.OWNER]
