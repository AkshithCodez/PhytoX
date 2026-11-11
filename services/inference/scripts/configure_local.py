"""Configure local inference without printing credentials or overwriting existing settings."""
from pathlib import Path
import secrets
from dotenv import dotenv_values, set_key

root=Path(__file__).resolve().parents[3]
service=root/'services/inference/.env'
web=root/'apps/web/.env.local'
service_values=dotenv_values(service) if service.exists() else {}
web_values=dotenv_values(web) if web.exists() else {}
service_key=service_values.get('INFERENCE_API_KEY')
web_key=web_values.get('INFERENCE_API_KEY')
if service_key and web_key and service_key != web_key:
    raise SystemExit('Existing inference keys differ. Reconcile them without sharing them in chat.')
key=service_key or web_key or secrets.token_urlsafe(32)
settings=[(service,service_values,{'INFERENCE_API_KEY':key,'MODEL_PATH':(root/'services/inference/models/supplied.onnx').as_posix(),'MODEL_MANIFEST':(root/'services/inference/models/supplied.manifest.json').as_posix()}),(web,web_values,{'INFERENCE_API_KEY':key,'INFERENCE_URL':'http://127.0.0.1:8000','APP_ORIGIN':'http://127.0.0.1:3000'})]
for path,existing,values in settings:
    for name,value in values.items():
        if not existing.get(name):
            set_key(str(path),name,value)
print('Local inference settings prepared. Existing configuration preserved; no credentials displayed.')
