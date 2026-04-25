import requests
import base64
import os
import json

api_key = "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"
url = "https://openrouter.ai/api/v1/chat/completions"

audio_file = "uploads/c4dbae4c-ba0c-4bd1-843a-80103c33dec6.webm"
with open(audio_file, "rb") as f:
    data = base64.b64encode(f.read()).decode("utf-8")

payload = {
    "model": "google/gemini-2.0-flash-exp:free",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Transcribe this audio lecture exactly."},
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
}

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

print("Sending manual request to OpenRouter...")
response = requests.post(url, headers=headers, data=json.dumps(payload))
print(f"Status: {response.status_code}")
print(response.text)
