from pathlib import Path
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound


def spa_view(request, exception=None):
    index_path = Path(settings.BASE_DIR) / "static" / "frontend" / "index.html"
    if not index_path.exists():
        return HttpResponseNotFound(
            "Frontend bundle not found. Run `npm run build` in frontend/."
        )
    return HttpResponse(index_path.read_text(encoding="utf-8"), content_type="text/html")


def service_worker(request):
    sw_path = Path(settings.BASE_DIR) / "static" / "frontend" / "sw.js"
    if not sw_path.exists():
        return HttpResponseNotFound(
            "Service worker not found. Run `npm run build` in frontend/."
        )
    response = HttpResponse(
        sw_path.read_text(encoding="utf-8"),
        content_type="application/javascript",
    )
    response["Service-Worker-Allowed"] = "/"
    response["Cache-Control"] = "no-store"
    return response
