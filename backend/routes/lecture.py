from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import os
import uuid
import shutil
from ..database import get_db
from ..models.user_lecture import Lecture
from ..services.transcription_service import transcription_service
from ..services.ai_service import ai_service
from ..services.youtube_service import youtube_service
from ..services.document_service import document_service
from ..config import settings
from ..schemas.lecture import LectureResponse

router = APIRouter(prefix="/lectures", tags=["lectures"])

def log_debug(msg):
    log_path = os.path.join(os.path.dirname(__file__), "..", "debug.log")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"{datetime.now()}: {msg}\n")
    print(msg)

@router.post("/process")
async def process_lecture(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    summary_language: str = Form("English"),
    flashcard_language: str = Form("English"),
    quiz_language: str = Form("English"),
    subject_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    # 1. Save File
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Initial DB Record
    new_lecture = Lecture(
        user_id=1, # Mock user_id for now until auth is implemented
        subject_id=subject_id,
        title=title,
        audio_path=file_path,
        transcript="Processing...",
        summary=[],
        flashcards=[],
        quiz=[],
        notes="",
        whiteboard_data=None,
    )
    db.add(new_lecture)
    db.commit()
    db.refresh(new_lecture)

    # 3. Queue Background Processing
    log_debug(f"DEBUG: Queuing background task for lecture {new_lecture.id}")
    background_tasks.add_task(
        run_lecture_pipeline, 
        new_lecture.id, 
        file_path, 
        summary_language, 
        flashcard_language, 
        quiz_language
    )

    return {"id": new_lecture.id, "status": "processing"}

@router.post("/process-document")
async def process_document_lecture(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    summary_language: str = Form("English"),
    flashcard_language: str = Form("English"),
    quiz_language: str = Form("English"),
    subject_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_lecture = Lecture(
        user_id=1,
        subject_id=subject_id,
        title=title,
        audio_path=file_path,
        transcript="Extracting text...",
        summary=[],
        flashcards=[],
        quiz=[],
        notes="",
        whiteboard_data=None,
    )
    db.add(new_lecture)
    db.commit()
    db.refresh(new_lecture)

    background_tasks.add_task(
        run_document_pipeline, 
        new_lecture.id, 
        file_path, 
        summary_language, 
        flashcard_language, 
        quiz_language
    )

    return {"id": new_lecture.id, "status": "processing"}

@router.post("/process-youtube")
async def process_youtube_lecture(
    background_tasks: BackgroundTasks,
    youtube_url: str = Form(...),
    title: str = Form(...),
    summary_language: str = Form("English"),
    flashcard_language: str = Form("English"),
    quiz_language: str = Form("English"),
    subject_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    new_lecture = Lecture(
        user_id=1,
        subject_id=subject_id,
        title=title,
        audio_path="",  # Will be set by background task
        transcript="Downloading audio...",
        summary=[],
        flashcards=[],
        quiz=[],
        notes="",
        whiteboard_data=None,
    )
    db.add(new_lecture)
    db.commit()
    db.refresh(new_lecture)

    background_tasks.add_task(
        run_youtube_pipeline, 
        new_lecture.id, 
        youtube_url, 
        summary_language, 
        flashcard_language, 
        quiz_language
    )

    return {"id": new_lecture.id, "status": "processing"}

from ..database import SessionLocal
import traceback

async def run_lecture_pipeline(lecture_id: int, file_path: str, lang_s: str, lang_f: str, lang_q: str):
    log_debug(f"DEBUG: Starting pipeline for lecture {lecture_id}")
    db = SessionLocal()
    try:
        # Transcribe
        log_debug("DEBUG: Transcribing...")
        transcript = await transcription_service.transcribe_audio(file_path)
        log_debug(f"DEBUG: Transcription complete. Length: {len(transcript)}")
        
        # 3. Consolidated AI Content Generation (Much Faster)
        log_debug(f"DEBUG: Generating AI content (Consolidated)...")
        content = await ai_service.generate_all_content(transcript, lang_s, lang_f, lang_q)
        summary = content.get("summary", [])
        flashcards = content.get("flashcards", [])
        quiz = content.get("quiz", [])
        topic_tag = content.get("topic_tag", "Lecture")
        notes = content.get("notes", "")

        # Update DB
        log_debug("DEBUG: Updating database...")
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if lecture:
            lecture.transcript = transcript
            lecture.summary = summary
            lecture.flashcards = flashcards
            lecture.quiz = quiz
            lecture.notes = notes
            lecture.topic_tag = topic_tag
            lecture.transcript_segments = content.get("transcript_segments", [])
            lecture.cornell_notes = content.get("cornell_notes", {})
            lecture.learning_chunks = content.get("learning_chunks", [])
            lecture.multi_summary = content.get("multi_summary", {})
            lecture.exam_prep = content.get("exam_prep", {})
            lecture.smart_sections = content.get("smart_sections", [])
            db.commit()
            log_debug(f"DEBUG: Pipeline complete for lecture {lecture_id}")
        else:
            log_debug(f"ERROR: Lecture {lecture_id} not found in DB")
    except Exception as e:
        log_debug(f"ERROR: Pipeline failed for lecture {lecture_id}: {str(e)}")
        log_debug(traceback.format_exc())
        try:
            lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
            if lecture:
                lecture.transcript = f"Processing Error: {str(e)}"
                db.commit()
        except: pass
    finally:
        db.close()

async def run_document_pipeline(lecture_id: int, file_path: str, lang_s: str, lang_f: str, lang_q: str):
    log_debug(f"DEBUG: Starting document pipeline for lecture {lecture_id}")
    db = SessionLocal()
    try:
        log_debug("DEBUG: Extracting text from document...")
        transcript = document_service.extract_text(file_path)
        log_debug(f"DEBUG: Text extraction complete. Length: {len(transcript)}")
        
        log_debug(f"DEBUG: Generating AI content (Consolidated)...")
        content = await ai_service.generate_all_content(transcript, lang_s, lang_f, lang_q)
        summary = content.get("summary", [])
        flashcards = content.get("flashcards", [])
        quiz = content.get("quiz", [])
        topic_tag = content.get("topic_tag", "Document")
        notes = content.get("notes", "")

        log_debug("DEBUG: Updating database...")
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if lecture:
            lecture.transcript = transcript
            lecture.summary = summary
            lecture.flashcards = flashcards
            lecture.quiz = quiz
            lecture.notes = notes
            lecture.topic_tag = topic_tag
            lecture.transcript_segments = content.get("transcript_segments", [])
            lecture.cornell_notes = content.get("cornell_notes", {})
            lecture.learning_chunks = content.get("learning_chunks", [])
            lecture.multi_summary = content.get("multi_summary", {})
            lecture.exam_prep = content.get("exam_prep", {})
            lecture.smart_sections = content.get("smart_sections", [])
            db.commit()
            log_debug(f"DEBUG: Document pipeline complete for lecture {lecture_id}")
        else:
            log_debug(f"ERROR: Lecture {lecture_id} not found in DB")
    except Exception as e:
        log_debug(f"ERROR: Document pipeline failed for lecture {lecture_id}: {str(e)}")
        log_debug(traceback.format_exc())
        try:
            lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
            if lecture:
                lecture.transcript = f"Processing Error: {str(e)}"
                db.commit()
        except: pass
    finally:
        db.close()

async def run_youtube_pipeline(lecture_id: int, url: str, lang_s: str, lang_f: str, lang_q: str):
    log_debug(f"DEBUG: Starting youtube pipeline for lecture {lecture_id}")
    db = SessionLocal()
    file_path = ""
    try:
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if not lecture:
            return
        log_debug("DEBUG: Downloading YouTube audio...")
        file_path = youtube_service.download_audio(url)
        lecture.audio_path = file_path
        db.commit()
    except Exception as e:
        log_debug(f"ERROR: YouTube download failed: {str(e)}")
        try:
            lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
            if lecture:
                lecture.transcript = f"Download Error: {str(e)}"
                db.commit()
        except: pass
        finally:
            db.close()
        return
    finally:
        db.close()

    if file_path:
        await run_lecture_pipeline(lecture_id, file_path, lang_s, lang_f, lang_q)

@router.get("/", response_model=List[LectureResponse])
async def get_lectures(db: Session = Depends(get_db)):
    lectures = db.query(Lecture).order_by(Lecture.created_at.desc()).all()
    return lectures

@router.get("/{lecture_id}", response_model=LectureResponse)
async def get_lecture(lecture_id: int, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture

@router.delete("/{lecture_id}")
async def delete_lecture(lecture_id: int, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    if os.path.exists(lecture.audio_path):
        os.remove(lecture.audio_path)
        
    db.delete(lecture)
    db.commit()
    return {"status": "success"}
@router.patch("/{lecture_id}/rename")
async def rename_lecture(lecture_id: int, title: str = Form(...), db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    lecture.title = title
    db.commit()
    db.refresh(lecture)
    return lecture
@router.patch("/{lecture_id}/subject")
async def update_lecture_subject(lecture_id: int, subject_id: Optional[int] = Form(None), db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    lecture.subject_id = subject_id
    db.commit()
    db.refresh(lecture)
    return lecture
    lecture.subject_id = subject_id
    db.commit()
    db.refresh(lecture)
    return lecture

@router.patch("/{lecture_id}/notes")
async def update_lecture_notes(lecture_id: int, notes: str = Form(...), db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    lecture.notes = notes
    db.commit()
    db.refresh(lecture)
    return lecture

@router.post("/{lecture_id}/generate-notes")
async def trigger_generate_notes(lecture_id: int, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if not lecture.transcript or lecture.transcript == "Processing...":
        raise HTTPException(status_code=400, detail="Transcript is not ready")
    
    notes = await ai_service.generate_notes(lecture.transcript)
    lecture.notes = notes
    db.commit()
    db.refresh(lecture)
    return lecture

@router.post("/{lecture_id}/generate-summary")
async def trigger_generate_summary(lecture_id: int, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if not lecture.transcript or lecture.transcript == "Processing...":
        raise HTTPException(status_code=400, detail="Transcript is not ready")

    summary = await ai_service.generate_summary(lecture.transcript)
    lecture.summary = summary
    db.commit()
    db.refresh(lecture)
    return lecture

@router.post("/{lecture_id}/generate-flashcards")
async def trigger_generate_flashcards(lecture_id: int, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if not lecture.transcript or lecture.transcript == "Processing...":
        raise HTTPException(status_code=400, detail="Transcript is not ready")

    flashcards = await ai_service.generate_flashcards(lecture.transcript)
    lecture.flashcards = flashcards
    db.commit()
    db.refresh(lecture)
    return lecture

@router.post("/{lecture_id}/generate-quiz")
async def trigger_generate_quiz(lecture_id: int, db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if not lecture.transcript or lecture.transcript == "Processing...":
        raise HTTPException(status_code=400, detail="Transcript is not ready")

    quiz = await ai_service.generate_quiz(lecture.transcript)
    lecture.quiz = quiz
    db.commit()
    db.refresh(lecture)
    return lecture
@router.patch("/{lecture_id}/whiteboard")
async def update_whiteboard_data(lecture_id: int, whiteboard_data: str = Form(...), db: Session = Depends(get_db)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    import json
    try:
        data = json.loads(whiteboard_data)
        lecture.whiteboard_data = data
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON data for whiteboard")
    db.commit()
    db.refresh(lecture)
    return lecture

@router.post("/upload-image")
async def upload_editor_image(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".png"
    file_name = f"{file_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"url": f"/uploads/{file_name}"}


@router.post("/{lecture_id}/explain")
async def explain_concept(
    lecture_id: int,
    concept: str = Form(...),
    level: str = Form("medium")  # "simple" | "medium" | "detailed"
):
    """Return a jargon-free, analogy-rich explanation of a concept at the chosen complexity level."""
    level_instruction = {
        "simple": (
            "Explain this as if talking to a 10-year-old with zero background knowledge. "
            "Use a relatable everyday analogy. Keep it under 4 sentences. No jargon whatsoever."
        ),
        "medium": (
            "Explain this clearly to a first-year university student. "
            "Use one analogy, define key terms simply, and keep it under 8 sentences."
        ),
        "detailed": (
            "Explain this thoroughly to someone who wants a deep understanding. "
            "Include the underlying mechanism, a real-world analogy, and mention any important nuances or edge cases. "
            "Keep it concise but complete — no fluffy padding."
        ),
    }.get(level, "Explain this clearly with an analogy.")

    prompt = f"""
    You are an expert educator who makes complex ideas feel simple.
    {level_instruction}

    Concept to explain:
    \"\"\"{concept}\"\"\"

    Return ONLY valid JSON with this exact structure:
    {{
        "explanation": "Your clear explanation here...",
        "analogy": "A specific real-world analogy that makes this click...",
        "key_insight": "The single most important thing to remember (one sentence)."
    }}
    """
    try:
        raw = await ai_service._generate(prompt)
        raw = raw.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        import json
        data = json.loads(raw)
        return {
            "explanation": data.get("explanation", ""),
            "analogy": data.get("analogy", ""),
            "key_insight": data.get("key_insight", ""),
            "level": level
        }
    except Exception as e:
        return {"explanation": raw, "analogy": "", "key_insight": "", "level": level}


@router.post("/{lecture_id}/feynman")
async def feynman_evaluate(
    lecture_id: int,
    user_explanation: str = Form(...),
    concept: str = Form("the main topic of this lecture"),
    db: Session = Depends(get_db)
):
    """Evaluate a user's explanation using the Feynman technique against lecture notes."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    reference = ""
    if lecture.notes:
        reference = f"LECTURE NOTES:\n{lecture.notes[:3000]}"
    elif lecture.transcript:
        reference = f"LECTURE TRANSCRIPT:\n{lecture.transcript[:3000]}"
    elif lecture.summary:
        import json
        pts = lecture.summary if isinstance(lecture.summary, list) else json.loads(lecture.summary or "[]")
        reference = f"LECTURE SUMMARY:\n" + "\n".join(f"- {p}" for p in pts[:15])

    prompt = f"""
    You are an expert educator applying the Feynman Technique.
    
    The user is trying to explain the concept: "{concept}"
    
    Reference material from the lecture:
    {reference}
    
    User's explanation:
    \"\"\"{user_explanation}\"\"\"
    
    Evaluate this explanation rigorously but constructively. Return ONLY valid JSON:
    {{
        "clarity_score": <integer 1-10, how clear and easy to understand>,
        "completeness_score": <integer 1-10, how well key ideas are covered>,
        "missing_points": ["key point 1 that was missing", "key point 2 that was missing", ...],
        "strong_points": ["something the user explained well", ...],
        "feedback": "A warm, constructive paragraph (3-5 sentences) telling the user specifically what they got right, what's missing, and one concrete tip to improve.",
        "improved_version": "A rewritten version of their explanation that fills the gaps but keeps their voice — max 4 sentences."
    }}
    """
    try:
        import json as json_lib
        raw = await ai_service._generate(prompt)
        raw = raw.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        data = json_lib.loads(raw)
        return {
            "clarity_score": data.get("clarity_score", 5),
            "completeness_score": data.get("completeness_score", 5),
            "missing_points": data.get("missing_points", []),
            "strong_points": data.get("strong_points", []),
            "feedback": data.get("feedback", ""),
            "improved_version": data.get("improved_version", ""),
        }
    except Exception as e:
        return {
            "clarity_score": 5, "completeness_score": 5,
            "missing_points": [], "strong_points": [],
            "feedback": raw, "improved_version": ""
        }


@router.get("/knowledge-graph")
async def get_knowledge_graph(db: Session = Depends(get_db)):
    """Build a semantic knowledge graph across all lectures using AI."""
    lectures = db.query(Lecture).filter(
        Lecture.transcript_segments != None
    ).all()

    if not lectures:
        return {"nodes": [], "edges": []}

    # Build compact summaries for AI
    lecture_infos = []
    for lec in lectures:
        import json as j
        summary_pts = []
        if lec.summary:
            try:
                pts = lec.summary if isinstance(lec.summary, list) else j.loads(lec.summary)
                summary_pts = pts[:3] if isinstance(pts, list) else []
            except: pass
        chunks = []
        if lec.learning_chunks:
            try:
                raw_chunks = lec.learning_chunks if isinstance(lec.learning_chunks, list) else j.loads(lec.learning_chunks)
                chunks = [c.get("title", "") for c in raw_chunks[:6] if isinstance(c, dict)]
            except: pass

        lecture_infos.append({
            "id": lec.id,
            "title": lec.title,
            "topic_tag": lec.topic_tag or lec.title,
            "summary_points": summary_pts,
            "chunk_titles": chunks,
        })

    if len(lecture_infos) < 2:
        nodes = [{"id": l["id"], "title": l["title"], "topic": l["topic_tag"], "group": 0} for l in lecture_infos]
        return {"nodes": nodes, "edges": []}

    prompt = f"""
    You are a knowledge graph builder. Given these lectures, identify semantic connections between them.
    
    Lectures:
    {[{"id": l["id"], "title": l["title"], "topic": l["topic_tag"], "concepts": l["chunk_titles"] + l["summary_points"][:2]} for l in lecture_infos]}
    
    Find meaningful connections — where one lecture's concepts build on, relate to, or complement another.
    Assign each lecture to a conceptual group (0-5).
    
    Return ONLY valid JSON:
    {{
        "nodes": [
            {{"id": <lecture_id>, "title": "...", "topic": "...", "group": <0-5>}}
        ],
        "edges": [
            {{"source": <id>, "target": <id>, "label": "relates to", "strength": <0.3-1.0>}}
        ]
    }}
    Keep edges to the most meaningful connections only (max {min(len(lecture_infos) * 3, 12)} edges).
    """
    try:
        import json as j2
        raw = await ai_service._generate(prompt)
        raw = raw.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        data = j2.loads(raw)
        return {
            "nodes": data.get("nodes", []),
            "edges": data.get("edges", [])
        }
    except Exception as e:
        # Fallback: return nodes with no edges
        nodes = [{"id": l["id"], "title": l["title"], "topic": l["topic_tag"], "group": i % 6}
                 for i, l in enumerate(lecture_infos)]
        return {"nodes": nodes, "edges": []}

