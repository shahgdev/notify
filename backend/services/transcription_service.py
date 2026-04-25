import openai
import os
import base64
import google.generativeai as genai
from ..config import settings

class TranscriptionService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.use_direct_gemini = self.api_key.startswith("AIza")
        self.use_openrouter = self.api_key.startswith("sk-or-v1")
        
        if self.use_direct_gemini:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        elif self.use_openrouter:
            self.client = openai.OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.api_key,
            )
            self.model_name = "openai/whisper-large-v3"
        else:
            openai.api_key = settings.OPENAI_API_KEY
            self.model_name = "whisper-1"

    async def transcribe_audio(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            print(f"ERROR: Audio file not found: {file_path}")
            return "Audio file not found."

        print(f"DEBUG: Transcribing {file_path} using {'Direct Gemini' if self.use_direct_gemini else self.model_name}...")
        
        try:
            if self.use_direct_gemini:
                with open(file_path, "rb") as f:
                    audio_data = f.read()
                
                # Gemini 1.5 Flash supports direct audio bytes in some SDK versions, 
                # but file upload is more reliable for webm
                response = self.model.generate_content([
                    "Transcribe this audio file exactly as spoken.",
                    {"mime_type": "audio/webm", "data": audio_data}
                ])
                return response.text
            elif self.use_openrouter:
                with open(file_path, "rb") as f:
                    data = base64.b64encode(f.read()).decode("utf-8")
                
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Provide an EXACT transcript of this audio file. Accuracy is critical."},
                                {
                                    "type": "input_audio",
                                    "input_audio": {
                                        "data": data,
                                        "format": "webm"
                                    }
                                }
                            ]
                        }
                    ]
                )
                transcript = response.choices[0].message.content
            else:
                with open(file_path, "rb") as audio_file:
                    transcript = openai.audio.transcriptions.create(
                        model="whisper-1", 
                        file=audio_file,
                        response_format="text"
                    )
            return transcript
        except Exception as e:
            print(f"ERROR during transcription: {str(e)}")
            return f"Transcribing lecture on {os.path.basename(file_path)}. (AI Transcription Service encountered an error: {str(e)})"

transcription_service = TranscriptionService()
