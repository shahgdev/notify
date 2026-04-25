import openai
import json
import re
import google.generativeai as genai
from ..config import settings

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.use_direct_gemini = self.api_key.startswith("AIza")
        self.use_openrouter = self.api_key.startswith("sk-or-v1")
        
        if self.use_direct_gemini:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(
                'gemini-2.5-flash',
                generation_config=genai.GenerationConfig(max_output_tokens=8192)
            )
        elif self.use_openrouter:
            self.client = openai.OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.api_key,
            )
            self.model_name = "google/gemini-2.0-flash-exp:free"
        else:
            openai.api_key = settings.OPENAI_API_KEY

    async def _generate(self, prompt: str) -> str:
        print(f"DEBUG: AI Prompt (first 120 chars): {prompt[:120]}...")
        try:
            if self.use_direct_gemini:
                response = self.model.generate_content(prompt)
                return response.text
            elif self.use_openrouter:
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=8192,
                    extra_body={"reasoning": {"enabled": True}}
                )
                return response.choices[0].message.content
            else:
                response = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.choices[0].message.content
        except Exception as e:
            print(f"ERROR in AI Generation: {e}")
            return f"Error generating content: {str(e)}"

    def _parse_json_response(self, text: str) -> dict | list | None:
        """Robustly extract and parse a JSON object or array from AI response text."""
        text = text.strip()
        # Strip markdown code fences (```json ... ```, ``` ... ```)
        code_block = re.search(r'```(?:json)?\s*([\s\S]*?)```', text, re.IGNORECASE)
        if code_block:
            text = code_block.group(1).strip()
        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        # Try extracting first {...} block
        obj_match = re.search(r'\{[\s\S]*\}', text)
        if obj_match:
            try:
                return json.loads(obj_match.group(0))
            except json.JSONDecodeError:
                pass
        # Try extracting first [...] array
        arr_match = re.search(r'\[[\s\S]*\]', text)
        if arr_match:
            try:
                return json.loads(arr_match.group(0))
            except json.JSONDecodeError:
                pass
        return None

    async def generate_summary(self, transcript: str, language: str = "English") -> list[str]:
        prompt = f"""
        Act as an expert academic assistant. Summarize the following lecture transcript into 5-7 concise bullet points.
        The summary MUST be in {language}.
        
        Transcript:
        {transcript}
        
        Return ONLY a JSON list of strings.
        Example: ["Point 1", "Point 2"]
        """
        text = await self._generate(prompt)
        data = self._parse_json_response(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("summary", [])
        return [line.strip("- ") for line in text.split("\n") if line.strip()]

    async def generate_flashcards(self, transcript: str, language: str = "English") -> list[dict]:
        prompt = f"""
        Act as an expert academic assistant. Generate 5-8 flashcards from the following lecture transcript.
        Each flashcard must have a 'question' and an 'answer'.
        The flashcards MUST be in {language}.
        
        Transcript:
        {transcript}
        
        Return ONLY a JSON list of objects.
        Example: [{{"question": "What is X?", "answer": "X is Y"}}]
        """
        text = await self._generate(prompt)
        data = self._parse_json_response(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("flashcards", [])
        return []

    async def generate_quiz(self, transcript: str, language: str = "English") -> list[dict]:
        prompt = f"""
        Act as an expert academic assistant. Generate a 5-question multiple-choice quiz from the following lecture transcript.
        Each question must have 'question', 'options' (list of 4), and 'correct_index' (0-3).
        The quiz MUST be in {language}.
        
        Transcript:
        {transcript}
        
        Return ONLY a JSON list of objects.
        Example: [{{"question": "Q?", "options": ["A", "B", "C", "D"], "correct_index": 1}}]
        """
        text = await self._generate(prompt)
        data = self._parse_json_response(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("quiz", [])
        return []

    async def generate_notes(self, transcript: str) -> str:
        prompt = f"""
You are a student writing clear, simple notes from a lecture. Keep it short and easy to understand.

RULES:
- Use ## for main topics (2-4 topics max)
- Use short bullet points — one idea per point, plain English
- Bold key terms with **term**
- Only add a simple table if comparing things side by side; otherwise use bullets
- No images, no URLs, no HTML, no code fences
- Start with ## directly — no introduction

TRANSCRIPT:
{transcript}

Write the notes now. Keep it simple.
"""
        text = await self._generate(prompt)
        text = text.strip()
        if text.startswith("```"):
            import re as _re
            text = _re.sub(r'^```[a-z]*\n?', '', text)
            text = _re.sub(r'\n?```$', '', text)
            text = text.strip()
        import re as _re
        text = _re.sub(r'!\[.*?\]\(.*?\)', '', text)
        return text

    async def generate_all_content(self, transcript: str, lang_s: str = "English", lang_f: str = "English", lang_q: str = "English") -> dict:
        """
        Split into two focused AI calls:
        - Call 1 (CORE): summary, flashcards, quiz, notes, topic_tag  ← always needed, compact
        - Call 2 (EXTRAS): transcript_segments, cornell_notes, learning_chunks, multi_summary, exam_prep, smart_sections
        """

        # ── CALL 1: Core content ──────────────────────────────────────────────────
        core_prompt = f"""
You are an expert academic assistant. Analyze this lecture transcript and generate FOUR things.

TRANSCRIPT:
{transcript}

Generate the following and return ONLY a valid JSON object with EXACTLY these keys:

1. "summary": Array of 5-7 concise bullet point strings summarizing the lecture. Language: {lang_s}.

2. "flashcards": Array of 8-12 flashcard objects. Each object:
   {{ "question": "...", "answer": "...", "difficulty": "easy|medium|hard", "topic": "Short Topic Name" }}
   - Mix conceptual ("Why/How?") with factual ("What is?") questions
   - Answers: 1-3 sentences max, concise and precise
   - Language: {lang_f}

3. "quiz": Array of 6-8 quiz question objects. Mix these types:
   - MCQ: {{ "type": "mcq", "question": "...", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "...", "difficulty": "easy|medium|hard", "topic": "..." }}
   - Short answer: {{ "type": "short", "question": "...", "sample_answer": "...", "explanation": "...", "difficulty": "...", "topic": "..." }}
   Language: {lang_q}

4. "notes": A full set of well-structured study notes in Markdown format. Use ## headings for main topics, ### for subtopics, and bullet points for details. Write complete explanations — this should be useful for revision. Do NOT copy the summary bullets here. This is a DIFFERENT section with detailed notes.

5. "topic_tag": 1-3 word identifier of the core subject (e.g., "Activity Diagrams", "World War II").

Return ONLY valid JSON. No explanation before or after. No markdown code fences.
Example structure:
{{
  "summary": ["Point 1", "Point 2"],
  "flashcards": [{{"question": "Q?", "answer": "A.", "difficulty": "medium", "topic": "Topic"}}],
  "quiz": [{{"type": "mcq", "question": "Q?", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "Because...", "difficulty": "easy", "topic": "Topic"}}],
  "notes": "## Main Topic\\n\\nDetailed explanation here...\\n\\n### Subtopic\\n\\n- Key point 1\\n- Key point 2",
  "topic_tag": "Subject Name"
}}
"""
        core_text = await self._generate(core_prompt)
        core_data = self._parse_json_response(core_text)

        # Validate core parse — if notes looks like raw JSON, reject it
        def _is_json_string(s: str) -> bool:
            s = s.strip()
            return s.startswith('{') or s.startswith('[')

        if isinstance(core_data, dict):
            raw_notes = core_data.get("notes", "")
            if isinstance(raw_notes, str):
                # Unescape \n \t that AI commonly escapes inside JSON strings
                raw_notes = raw_notes.replace("\\n", "\n").replace("\\t", "\t")
                # Strip any image markdown the model embedded (broken external URLs)
                import re as _re
                raw_notes = _re.sub(r'!\[.*?\]\(.*?\)', '', raw_notes)
                # If notes is still raw JSON (parse failed for notes field), clear it
                if _is_json_string(raw_notes):
                    raw_notes = ""
            notes = raw_notes
        else:
            # Core parse fully failed — log and use empty notes (never store raw JSON)
            print(f"ERROR: Core AI parse failed. Raw (first 300): {core_text[:300]}")
            core_data = {}
            notes = ""

        # ── CALL 2: Extras (non-critical, failure is safe) ───────────────────────
        extras_prompt = f"""
You are an expert academic assistant. Analyze this lecture transcript and generate supplementary study material.

TRANSCRIPT:
{transcript}

Return ONLY a valid JSON object with EXACTLY these keys:

"transcript_segments": Array grouping the transcript into 2-7 minute topic blocks. Each:
  {{ "title": "...", "start_time": "00:00", "end_time": "03:15", "summary": "1-2 sentences." }}
  Estimate timestamps at 150 words/minute. First segment always starts at "00:00".

"cornell_notes": Object with:
  "main_notes": Markdown string with key concepts organized by topic headings.
  "key_questions": Array of 5-8 critical thinking questions (strings).
  "summary": 3-5 sentence paragraph of core takeaway.

"learning_chunks": Array of micro-learning units. Each:
  {{ "title": "Concept Name", "content": "3-6 line explanation", "difficulty": "easy|medium|hard", "related": ["Other Chunk Title"] }}

"multi_summary": Object with:
  "quick": "2-3 line ultra-concise summary."
  "standard": "5-8 sentence paragraph covering all key ideas."
  "detailed": "Markdown with headings, sub-bullets, and **key terms**."

"exam_prep": Object with:
  "high_yield_points": Array of 5-8 most testable concepts (one-liner each).
  "likely_questions": Array of 4-6 probable exam questions.
  "common_mistakes": Array of 3-5 typical student errors.

"smart_sections": Array of topic sections. Each:
  {{ "heading": "Section Title", "content": "4-8 sentence explanation", "key_points": ["Point 1"], "simplified": "Plain language 2-4 sentences.", "expanded": "Advanced 4-8 sentences." }}

Return ONLY valid JSON. No explanation, no code fences.
"""
        extras_data = {}
        try:
            extras_text = await self._generate(extras_prompt)
            parsed_extras = self._parse_json_response(extras_text)
            if isinstance(parsed_extras, dict):
                extras_data = parsed_extras
            else:
                print(f"WARN: Extras AI parse returned non-dict. Raw (first 200): {extras_text[:200]}")
        except Exception as e:
            print(f"WARN: Extras AI call failed (non-critical): {e}")

        return {
            "summary": core_data.get("summary", []) if isinstance(core_data, dict) else [],
            "flashcards": core_data.get("flashcards", []) if isinstance(core_data, dict) else [],
            "quiz": core_data.get("quiz", []) if isinstance(core_data, dict) else [],
            "notes": notes,
            "topic_tag": core_data.get("topic_tag", "Lecture") if isinstance(core_data, dict) else "Lecture",
            "transcript_segments": extras_data.get("transcript_segments", []),
            "cornell_notes": extras_data.get("cornell_notes", {}),
            "learning_chunks": extras_data.get("learning_chunks", []),
            "multi_summary": extras_data.get("multi_summary", {}),
            "exam_prep": extras_data.get("exam_prep", {}),
            "smart_sections": extras_data.get("smart_sections", []),
        }

ai_service = AIService()
