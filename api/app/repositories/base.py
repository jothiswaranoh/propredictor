from typing import Generic, TypeVar, Type, List, Optional, Any, Dict
from bson import ObjectId
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorCollection
from app.database import db_helper
from app.exceptions import NotFoundException

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], collection_name: str):
        self.model = model
        self.collection_name = collection_name

    @property
    def collection(self) -> AsyncIOMotorCollection:
        if db_helper.db is None:
            raise RuntimeError("Database connection not initialized.")
        return db_helper.db[self.collection_name]

    def _to_object_id(self, id_str: Any) -> ObjectId:
        if isinstance(id_str, ObjectId):
            return id_str
        try:
            return ObjectId(str(id_str))
        except Exception:
            raise NotFoundException(f"Invalid ID format: {id_str}")

    async def get_by_id(self, id_str: str) -> Optional[ModelType]:
        obj_id = self._to_object_id(id_str)
        doc = await self.collection.find_one({"_id": obj_id})
        return self.model(**doc) if doc else None

    async def get_all(self, filter_query: Dict[str, Any] = None, sort_by: str = None, descending: bool = False) -> List[ModelType]:
        query = filter_query or {}
        cursor = self.collection.find(query)
        if sort_by:
            direction = -1 if descending else 1
            cursor = cursor.sort(sort_by, direction)
        docs = await cursor.to_list(length=1000)
        return [self.model(**doc) for doc in docs]

    async def get_paginated(
        self,
        filter_query: Dict[str, Any] = None,
        sort_by: str = None,
        descending: bool = False,
        page: int = 1,
        limit: int = 20
    ) -> tuple[List[ModelType], int]:
        query = filter_query or {}
        total = await self.collection.count_documents(query)
        
        cursor = self.collection.find(query)
        if sort_by:
            direction = -1 if descending else 1
            cursor = cursor.sort(sort_by, direction)
            
        skip = (page - 1) * limit
        cursor = cursor.skip(skip).limit(limit)
        
        docs = await cursor.to_list(length=limit)
        return [self.model(**doc) for doc in docs], total

    async def create(self, document_dict: Dict[str, Any]) -> ModelType:
        if "active" not in document_dict:
            document_dict["active"] = True
        
        result = await self.collection.insert_one(document_dict)
        created_doc = await self.collection.find_one({"_id": result.inserted_id})
        return self.model(**created_doc)

    async def update(self, id_str: str, update_dict: Dict[str, Any]) -> ModelType:
        obj_id = self._to_object_id(id_str)
        result = await self.collection.update_one(
            {"_id": obj_id},
            {"$set": update_dict}
        )
        if result.matched_count == 0:
            raise NotFoundException(f"{self.model.__name__} not found")
        updated_doc = await self.collection.find_one({"_id": obj_id})
        return self.model(**updated_doc)

    async def delete(self, id_str: str) -> bool:
        obj_id = self._to_object_id(id_str)
        result = await self.collection.delete_one({"_id": obj_id})
        if result.deleted_count == 0:
            raise NotFoundException(f"{self.model.__name__} not found")
        return True
