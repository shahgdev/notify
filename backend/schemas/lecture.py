from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any

class LectureBase(BaseModel):
    title: str
    subject_id: Optional[int] = None
    duration: Optional[str] = None
    transcript: Optional[str] = None
    transcript_segments: Optional[List[Any]] = None
    summary: Optional[List[str]] = []
    flashcards: Optional[List[Any]] = []
    quiz: Optional[List[Any]] = []
    notes: Optional[str] = None
    whiteboard_data: Optional[Any] = None
    topic_tag: Optional[str] = None
    cornell_notes: Optional[Any] = None
    learning_chunks: Optional[List[Any]] = None
    multi_summary: Optional[Any] = None
    exam_prep: Optional[Any] = None
    smart_sections: Optional[List[Any]] = None

class LectureCreate(LectureBase):
    audio_path: str
    user_id: int

class LectureResponse(LectureBase):
    id: int
    user_id: int
    audio_path: str
    created_at: datetime

    class Config:
        from_attributes = True
