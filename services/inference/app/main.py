import asyncio
import hmac
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, Header, HTTPException, Form, Query
from fastapi.concurrency import run_in_threadpool
from .model import ModelAdapter, decode_image, InvalidImage, MAX_BYTES
from .schemas import PredictionResponse
from .limits import PredictionRequestLimit

adapter = ModelAdapter()
capacity = asyncio.Semaphore(2)

@asynccontextmanager
async def lifespan(app):
    await run_in_threadpool(adapter.load)
    yield

app = FastAPI(title='PhytoX Inference', version='1.0.0', lifespan=lifespan)
app.add_middleware(PredictionRequestLimit)

@app.get('/health')
def health():
    return {'status': 'ok', 'schema_version': '1.0'}

@app.get('/ready')
def ready():
    configured = bool(os.getenv('INFERENCE_API_KEY'))
    return {'ready': adapter.ready and configured, 'reason': adapter.reason if configured else 'service_key_unconfigured'}

@app.post('/v1/predict', response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    selected_crop: str | None = Form(default=None),
    crop: str | None = Query(default=None),
    x_api_key: str | None = Header(default=None)
):
    secret = os.getenv('INFERENCE_API_KEY')
    if not secret:
        raise HTTPException(503, detail={'code': 'service_unconfigured'})
    if not x_api_key or not hmac.compare_digest(secret.encode('utf-8'), x_api_key.encode('latin1')):
        raise HTTPException(401, detail={'code': 'unauthorized'})
    raw = await file.read(MAX_BYTES + 1)
    await file.close()
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, detail={'code': 'image_too_large'})
    async with capacity:
        try:
            image, quality = await run_in_threadpool(decode_image, raw)
        except InvalidImage as exc:
            raise HTTPException(422, detail={'code': 'invalid_image', 'message': str(exc)}) from exc
        if not adapter.ready:
            raise HTTPException(503, detail={'code': adapter.reason})
        try:
            chosen_crop = selected_crop or crop
            return await run_in_threadpool(adapter.predict, image, quality, chosen_crop)
        except Exception as exc:
            raise HTTPException(502, detail={'code': 'inference_failed'}) from exc
