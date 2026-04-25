from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lectures = relationship("Lecture", back_populates="user")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="subjects")
    lectures = relationship("Lecture", back_populates="subject")

class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    title = Column(String)
    duration = Column(String)
    transcript = Column(String)
    transcript_segments = Column(JSON, nullable=True) # Array of semantic topic blocks
    summary = Column(JSON) # Store as list of points
    flashcards = Column(JSON) # Store as list of objects
    quiz = Column(JSON) # Store as list of objects
    notes = Column(String) # Store as markdown text
    whiteboard_data = Column(JSON, nullable=True) # Store Excalidraw JSON
    audio_path = Column(String)
    topic_tag = Column(String, nullable=True)
    cornell_notes = Column(JSON, nullable=True) # Structured Cornell Notes
    learning_chunks = Column(JSON, nullable=True) # Micro-learning units
    multi_summary = Column(JSON, nullable=True) # Quick/standard/detailed summaries
    exam_prep = Column(JSON, nullable=True) # Exam-focused intelligence
    smart_sections = Column(JSON, nullable=True) # Smart learning sections
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="lectures")
    subject = relationship("Subject", back_populates="lectures")

# Add relationship to User
User.subjects = relationship("Subject", back_populates="user")
User.lectures = relationship("Lecture", back_populates="user")
