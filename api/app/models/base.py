from typing import Annotated
from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, PlainSerializer, Field

# PyObjectId maps BSON ObjectId to string in Pydantic serialization/validation
PyObjectId = Annotated[
    str,
    BeforeValidator(lambda x: str(x) if isinstance(x, ObjectId) else x),
    PlainSerializer(lambda x: str(x), return_type=str)
]

class MongoBaseModel(BaseModel):
    id: PyObjectId = Field(default=None, alias="_id")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str
        }
    }
