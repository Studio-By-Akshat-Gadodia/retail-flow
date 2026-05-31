from rest_framework.response import Response


class APIResponse:
    @staticmethod
    def success(data=None, status_code=200):
        return Response({"status": "success", "data": data}, status=status_code)

    @staticmethod
    def failed(data=None, status_code=400):
        return Response({"status": "failed", "data": data}, status=status_code)
