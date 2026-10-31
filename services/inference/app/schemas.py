from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Literal
import math

class Label(BaseModel):
    model_config = ConfigDict(extra='forbid')
    crop: str = Field(min_length=1, max_length=100)
    disease: str = Field(min_length=1, max_length=160)

class Manifest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    version: str = Field(min_length=1)
    architecture: str = Field(min_length=1)
    input_size: int = Field(ge=32, le=1024)
    mean: list[float] = Field(min_length=3, max_length=3)
    std: list[float] = Field(min_length=3, max_length=3)
    labels: list[Label] = Field(min_length=2)
    confidence_threshold: float = Field(default=.7, ge=0, le=1)
    margin_threshold: float = Field(default=.15, ge=0, le=1)
    preprocessing: Literal['rgb_resize_bilinear']
    output: Literal['logits']

    @model_validator(mode='after')
    def valid_normalization(self):
        if any(not math.isfinite(x) for x in self.mean + self.std) or any(x <= 0 for x in self.std):
            raise ValueError('Invalid normalization')
        if len({(x.crop, x.disease) for x in self.labels}) != len(self.labels):
            raise ValueError('Duplicate labels')
        return self

class Prediction(Label):
    confidence: float = Field(ge=0, le=1, allow_inf_nan=False)

class PredictionResponse(BaseModel):
    schema_version: Literal['1.0'] = '1.0'
    status: Literal['success'] = 'success'
    model_version: str
    prediction: Prediction
    alternatives: list[Prediction]
    quality_warnings: list[str]
    review_recommended: bool
    abstained: bool
    uncertainty_note: str = 'Model confidence is not proven accuracy. Unknown-image detection has not been validated.'
