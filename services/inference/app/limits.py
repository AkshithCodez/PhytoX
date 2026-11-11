import hmac
import os
from starlette.responses import JSONResponse

class PredictionRequestLimit:
    """Authenticate and bound the raw body before multipart parsing/spooling."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http' or scope.get('path') != '/v1/predict':
            return await self.app(scope, receive, send)
        headers = dict(scope.get('headers', []))
        secret = os.getenv('INFERENCE_API_KEY')
        provided = headers.get(b'x-api-key', b'')
        if not secret or not hmac.compare_digest(secret.encode('utf-8'), provided):
            response = JSONResponse({'detail': {'code': 'service_unconfigured' if not secret else 'unauthorized'}}, status_code=503 if not secret else 401)
            return await response(scope, receive, send)
        chunks = []
        length = 0
        while True:
            message = await receive()
            if message['type'] == 'http.disconnect':
                return
            body = message.get('body', b'')
            length += len(body)
            if length > 9 * 1024 * 1024:
                return await JSONResponse({'detail': {'code': 'request_too_large'}}, status_code=413)(scope, receive, send)
            chunks.append(body)
            if not message.get('more_body', False):
                break
        delivered = False
        async def limited_receive():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {'type': 'http.request', 'body': b''.join(chunks), 'more_body': False}
            return await receive()
        await self.app(scope, limited_receive, send)
