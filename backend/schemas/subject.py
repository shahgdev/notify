from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SubjectBase(BaseModel):
    name: str

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
