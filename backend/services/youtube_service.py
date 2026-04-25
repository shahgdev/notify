import yt_dlp
import os
import uuid
from ..config import settings

class YouTubeService:
    def __init__(self):
        pass

    def download_audio(self, url: str) -> str:
        """
        Downloads the best audio track from a YouTube video 
        and saves it to the uploads directory.
        Returns the path to the downloaded audio file.
        """
        file_id = str(uuid.uuid4())
        # outtmpl template dictates where yt-dlp stores the downloaded file
        output_template = os.path.join(settings.UPLOAD_DIR, f"{file_id}.%(ext)s")
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'quiet': True,
            'noplaylist': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # extract_info with download=True downloads the file
            info = ydl.extract_info(url, download=True)
            # Find out what extension was actually downloaded
            ext = info.get('ext', 'webm')
            
        final_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.{ext}")
        return final_path

youtube_service = YouTubeService()
