import math

from rest_framework.pagination import PageNumberPagination

from core.responses import APIResponse


def paginate_or_full(qs, request, view, serializer_class, serializer_context=None):
    """Opt-in pagination helper used by list views.

    - If ``page`` or ``page_size`` is in the query string, returns the paginated envelope.
    - Otherwise serializes the whole queryset and returns ``APIResponse.success``.
    """
    context = serializer_context or {}
    params = request.query_params
    if 'page' in params or 'page_size' in params:
        paginator = StandardPaginator()
        page = paginator.paginate_queryset(qs, request, view=view)
        return paginator.get_paginated_response(
            serializer_class(page, many=True, context=context).data
        )
    return APIResponse.success(data=serializer_class(qs, many=True, context=context).data)


class StandardPaginator(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        total_count = self.page.paginator.count
        page_size   = self.get_page_size(self.request)
        total_pages = math.ceil(total_count / page_size) if page_size else 1

        return APIResponse.success(data={
            'total_count': total_count,
            'total_pages': total_pages,
            'current_page': self.page.number,
            'page_size': page_size,
            'results': data,
        })

    def get_paginated_response_schema(self, schema):
        return {
            'type': 'object',
            'properties': {
                'status': {'type': 'string', 'example': 'success'},
                'data': {
                    'type': 'object',
                    'properties': {
                        'total_count': {'type': 'integer'},
                        'total_pages': {'type': 'integer'},
                        'current_page': {'type': 'integer'},
                        'page_size': {'type': 'integer'},
                        'results': schema,
                    },
                },
            },
        }
