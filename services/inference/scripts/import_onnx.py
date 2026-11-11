"""Import a trusted PyTorch ONNX export and its original ordered class mapping."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

parser = argparse.ArgumentParser()
parser.add_argument('--model', type=Path, required=True)
parser.add_argument('--classes', type=Path, required=True)
parser.add_argument('--architecture', required=True)
args = parser.parse_args()
names = json.loads(args.classes.read_text(encoding='utf-8'))['class_names']
if len(names) < 2 or len(set(names)) != len(names) or any('___' not in name for name in names):
    raise ValueError('Expected unique ordered Crop___Disease labels')
digest = hashlib.sha256(args.model.read_bytes()).hexdigest()
target = Path(__file__).resolve().parents[1] / 'models'
target.mkdir(exist_ok=True)
manifest = {
    'version': f'local-onnx-{digest[:12]}', 'architecture': args.architecture,
    'runtime': 'onnx', 'sha256': digest, 'input_size': 224,
    'mean': [0.485, 0.456, 0.406], 'std': [0.229, 0.224, 0.225],
    'labels': [{'crop': name.split('___')[0].replace('_', ' ').strip(), 'disease': name.split('___')[1].replace('_', ' ').strip()} for name in names],
    'confidence_threshold': 0.7, 'margin_threshold': 0.15,
    'preprocessing': 'rgb_resize_bilinear', 'output': 'logits',
}
shutil.copyfile(args.model, target / 'supplied.onnx')
(target / 'supplied.manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'model_version': manifest['version'], 'classes': len(names), 'sha256': digest}))
