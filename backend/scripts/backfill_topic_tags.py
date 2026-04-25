import asyncio
import os
import sys

# Add the parent directory to sys.path to allow imports from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

try:
    from backend.database import SessionLocal
    from backend.models.user_lecture import Lecture
    from backend.services.ai_service import ai_service
except ImportError as e:
    print(f"ImportError: {e}")
    print("Trying alternative imports...")
    from database import SessionLocal
    from models.user_lecture import Lecture
    from services.ai_service import ai_service

async def backfill_topic_tags():
    db = SessionLocal()
    try:
        # Fetch lectures that have no topic_tag or topic_tag is "Lecture" or "Processing..."
        lectures = db.query(Lecture).filter(
            (Lecture.topic_tag == None) | (Lecture.topic_tag == 'Lecture') | (Lecture.topic_tag == 'Processing...')
        ).all()
        
        if not lectures:
            print("No lectures found that need backfilling.")
            return

        print(f"Found {len(lectures)} lectures to backfill.")
        
        for lecture in lectures:
            if not lecture.transcript or lecture.transcript == "Processing...":
                print(f"Skipping lecture {lecture.id} ('{lecture.title}') - No valid transcript.")
                continue
                
            print(f"Processing lecture {lecture.id}: '{lecture.title}'")
            try:
                # Use generate_all_content to get the topic_tag
                content = await ai_service.generate_all_content(lecture.transcript)
                topic_tag = content.get("topic_tag", "Lecture")
                
                lecture.topic_tag = topic_tag
                db.commit()
                print(f"  -> Assigned topic_tag: [{topic_tag}]")
            except Exception as e:
                print(f"  -> Error processing lecture {lecture.id}: {e}")
                db.rollback()
                
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(backfill_topic_tags())
