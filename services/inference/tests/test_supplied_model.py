"""Optional artifact smoke test; deliberately makes no accuracy assertion."""
import io
from pathlib import Path
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient
from app.model import ModelAdapter
from app.main import app, adapter

MODELS = Path(__file__).resolve().parents[1] / 'models'

def test_supplied_onnx_executes_and_returns_valid_api_contract(monkeypatch):
    if not (MODELS / 'supplied.onnx').exists():
        pytest.skip('Operator-supplied artifact is not installed')
    pytest.importorskip('onnxruntime')
    monkeypatch.setenv('MODEL_PATH', str(MODELS / 'supplied.onnx'))
    monkeypatch.setenv('MODEL_MANIFEST', str(MODELS / 'supplied.manifest.json'))
    monkeypatch.setenv('INFERENCE_API_KEY', 'test-only-inference-key')
    # Synthetic texture tests the executable graph, not plant recognition accuracy.
    pixels=np.random.default_rng(42).integers(30,210,(224,224,3),dtype=np.uint8)
    image=Image.fromarray(pixels)
    local=ModelAdapter();local.load()
    assert local.ready
    first=local.predict(image,[]);second=local.predict(image,[])
    assert first.model_dump()==second.model_dump()
    assert first.review_recommended
    assert len(first.alternatives)==4
    stream=io.BytesIO();image.save(stream,format='PNG')
    with TestClient(app) as client:
        assert client.get('/ready').json()['ready'] is True
        response=client.post('/v1/predict',headers={'x-api-key':'test-only-inference-key'},files={'file':('synthetic-test.png',stream.getvalue(),'image/png')})
        assert response.status_code==200
        assert response.json()['model_version']==first.model_version
        assert response.json()['prediction']==first.prediction.model_dump()
    # Do not leak configured adapter state into unrelated tests.
    adapter.model=None;adapter.manifest=None;adapter.reason='model_unconfigured'

def test_fingerprint_mismatch_fails_closed(monkeypatch,tmp_path):
    import json
    manifest=json.loads((MODELS / 'manifest.example.json').read_text())
    manifest['sha256']='0'*64
    path=tmp_path/'manifest.json';path.write_text(json.dumps(manifest))
    weights=tmp_path/'weights.pt';weights.write_bytes(b'untrusted fixture')
    monkeypatch.setenv('MODEL_PATH',str(weights));monkeypatch.setenv('MODEL_MANIFEST',str(path))
    local=ModelAdapter();local.load();assert not local.ready;assert local.reason=='model_load_failed'

@pytest.mark.parametrize('input_batch,output_batch,output_type', [(2, 1, 'tensor(float)'), (1, 2, 'tensor(float)'), (1, 1, 'tensor(int64)')])
def test_incompatible_onnx_contract_is_not_ready(monkeypatch, tmp_path, input_batch, output_batch, output_type):
    import json
    from types import SimpleNamespace
    ort = pytest.importorskip('onnxruntime')
    manifest = json.loads((MODELS / 'manifest.example.json').read_text())
    manifest['runtime'] = 'onnx'
    path = tmp_path / 'manifest.json'
    path.write_text(json.dumps(manifest))
    fake = SimpleNamespace(
        get_inputs=lambda: [SimpleNamespace(type='tensor(float)', shape=[input_batch, 3, manifest['input_size'], manifest['input_size']])],
        get_outputs=lambda: [SimpleNamespace(type=output_type, shape=[output_batch, len(manifest['labels'])])],
    )
    monkeypatch.setattr(ort, 'InferenceSession', lambda *args, **kwargs: fake)
    monkeypatch.setenv('MODEL_PATH', 'contract-fixture.onnx')
    monkeypatch.setenv('MODEL_MANIFEST', str(path))
    local = ModelAdapter()
    local.load()
    assert not local.ready
    assert local.reason == 'model_load_failed'
