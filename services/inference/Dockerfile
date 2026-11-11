FROM python:3.11-slim
WORKDIR /service
COPY requirements.txt requirements-onnx.txt ./
RUN pip install --no-cache-dir -r requirements-onnx.txt && useradd --create-home phytox
COPY app ./app
USER phytox
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
