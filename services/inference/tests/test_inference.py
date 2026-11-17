import io
import numpy as np
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app, adapter
from app.model import decode_image, InvalidImage, postprocess
from app.schemas import Manifest

def photo(mode='PNG', size=(224,224), color=(70,120,60)):
    stream=io.BytesIO(); Image.new('RGB',size,color).save(stream,format=mode); return stream.getvalue()

@pytest.fixture
def manifest():
    return Manifest(version='test-fixture',architecture='fixture',input_size=224,mean=[0,0,0],std=[1,1,1],labels=[{'crop':'A','disease':'B'},{'crop':'A','disease':'C'}],preprocessing='rgb_resize_bilinear',output='logits')

def test_decoding():
    image, warnings=decode_image(photo()); assert image.size==(224,224); assert warnings==[]

@pytest.mark.parametrize('raw',[b'not an image',photo('GIF'),photo(size=(32,32)),b'a'*(8*1024*1024+1)])
def test_invalid_images(raw):
    with pytest.raises(InvalidImage): decode_image(raw)

def test_exposure_warning():
    assert 'underexposed' in decode_image(photo(color=(0,0,0)))[1]

def test_uncertain(manifest):
    result=postprocess([[1,1]],manifest,[]); assert result.abstained; assert result.review_recommended
    assert result.prediction.confidence == .5

@pytest.mark.parametrize('output',[[[float('nan'),1]],[[1]],[[1,2],[3,4]]])
def test_malformed_output(output,manifest):
    with pytest.raises(ValueError): postprocess(output,manifest,[])

def test_probabilities(manifest):
    result=postprocess([[3,0]],manifest,[])
    assert not result.abstained
    assert result.prediction.confidence+result.alternatives[0].confidence==pytest.approx(1)

def test_api_unavailable_and_auth(monkeypatch):
    monkeypatch.setenv('INFERENCE_API_KEY','test-secret'); monkeypatch.setattr(adapter,'model',None)
    client=TestClient(app)
    assert client.get('/health').status_code==200
    assert client.get('/ready').json()['ready'] is False
    assert client.post('/v1/predict',files={'file':('leaf.png',photo())}).status_code==401
    response=client.post('/v1/predict',headers={'x-api-key':'test-secret'},files={'file':('leaf.png',photo())})
    assert response.status_code==503
    assert client.post('/v1/predict',headers={'x-api-key':'test-secret'},files={'file':('bad.png',b'bad')}).status_code==422

def test_inference_failure(monkeypatch,manifest):
    monkeypatch.setenv('INFERENCE_API_KEY','test-secret'); monkeypatch.setattr(adapter,'model',object()); monkeypatch.setattr(adapter,'manifest',manifest)
    def broken(*args): raise RuntimeError('internal details')
    monkeypatch.setattr(adapter,'predict',broken)
    response=TestClient(app).post('/v1/predict',headers={'x-api-key':'test-secret'},files={'file':('leaf.png',photo())})
    assert response.status_code==502; assert 'internal details' not in response.text

def test_body_limit_before_multipart(monkeypatch):
    monkeypatch.setenv('INFERENCE_API_KEY','test-secret')
    client=TestClient(app)
    response=client.post('/v1/predict',headers={'x-api-key':'test-secret','content-type':'application/octet-stream'},content=b'x'*(9*1024*1024+1))
    assert response.status_code==413

def test_non_ascii_api_key_is_rejected_without_server_error(monkeypatch):
    monkeypatch.setenv('INFERENCE_API_KEY', 'test-secret')
    response = TestClient(app).post('/v1/predict', headers={b'x-api-key': b'\xff'}, content=b'invalid body')
    assert response.status_code == 401
    assert response.json()['detail']['code'] == 'unauthorized'

@pytest.fixture
def multi_crop_manifest():
    return Manifest(
        version='multi-crop-fixture',
        architecture='fixture',
        input_size=224,
        mean=[0, 0, 0],
        std=[1, 1, 1],
        labels=[
            {'crop': 'Tomato', 'disease': 'Bacterial spot'},
            {'crop': 'Tomato', 'disease': 'Early blight'},
            {'crop': 'Grape', 'disease': 'Black rot'},
            {'crop': 'Grape', 'disease': 'Esca'},
        ],
        confidence_threshold=0.7,
        margin_threshold=0.15,
        preprocessing='rgb_resize_bilinear',
        output='logits',
    )

def test_crop_conditioning_restricts_to_selected_crop(multi_crop_manifest):
    # Logits strongly favor Grape (classes 2 and 3)
    logits = [[0.0, 0.0, 4.0, 3.0]]
    res = postprocess(logits, multi_crop_manifest, [], selected_crop='Tomato')
    assert res.prediction.crop == 'Tomato'
    assert res.prediction.disease in {'Bacterial spot', 'Early blight'}
    assert res.prediction.confidence == pytest.approx(0.5, abs=0.01)
    assert res.selected_crop == 'Tomato'
    assert res.detected_crop == 'Grape'
    assert res.crop_mismatch_warning is True
    assert res.abstained is True
    assert 'detected features typical of Grape' in res.mismatch_message

def test_crop_matching_without_mismatch(multi_crop_manifest):
    # Logits strongly favor Tomato (classes 0 and 1)
    logits = [[4.0, 1.0, 0.0, 0.0]]
    res = postprocess(logits, multi_crop_manifest, [], selected_crop='Tomato')
    assert res.prediction.crop == 'Tomato'
    assert res.prediction.disease == 'Bacterial spot'
    assert res.selected_crop == 'Tomato'
    assert res.detected_crop == 'Tomato'
    assert res.crop_mismatch_warning is False
    assert res.crop_confidence > 0.9

def test_unknown_or_empty_crop_defaults_to_unconditioned(multi_crop_manifest):
    logits = [[0.0, 0.0, 4.0, 3.0]]
    res = postprocess(logits, multi_crop_manifest, [], selected_crop='not_sure')
    assert res.prediction.crop == 'Grape'
    assert res.selected_crop is None
    assert res.crop_mismatch_warning is False
