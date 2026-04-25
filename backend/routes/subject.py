from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user_lecture import Subject
from ..schemas.subject import SubjectCreate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["subjects"])

@router.post("/", response_model=SubjectResponse)
async def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    try:
        db_subject = Subject(
            name=subject.name,
            user_id=1 # Mock user_id
        )
        db.add(db_subject)
        db.commit()
        db.refresh(db_subject)
        return db_subject
    except Exception as e:
        db.rollback()
        print(f"Error creating subject: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[SubjectResponse])
async def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()

@router.delete("/{subject_id}")
async def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(db_subject)
    db.commit()
    return {"status": "success"}
