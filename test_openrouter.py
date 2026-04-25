import openai
import base64
import os
import json

api_key = "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"
client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

audio_file = "uploads/c4dbae4c-ba0c-4bd1-843a-80103c33dec6.webm"
if not os.path.exists(audio_file):
    print(f"Audio file missing: {audio_file}")
    exit(1)

with open(audio_file, "rb") as f:
    data = base64.b64encode(f.read()).decode("utf-8")

print("Sending request to OpenRouter...")
try:
    response = client.chat.completions.create(
        model="openai/whisper-large-v3-turbo",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Transcribe this audio."},
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
    print("Response received:")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Error: {e}")
