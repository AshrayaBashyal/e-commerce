from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    if isinstance(response.data, dict) and "detail" in response.data:
        message = response.data["detail"]
    else:
        message = response.data

    response.data = {"error": message}
    return response
