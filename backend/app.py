from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({
        'status': 'ok',
        'message': 'SuperApp Video Downloader API - REAL EXTRACTION',
        'version': '2.0.0',
        'powered_by': 'yt-dlp'
    })

@app.route('/api/extract', methods=['POST', 'OPTIONS'])
def extract():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # yt-dlp options for MAXIMUM extraction
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'format': 'best',
            'nocheckcertificate': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Extract all available formats
            formats = info.get('formats', [])
            
            # Video formats
            video_formats = []
            audio_formats = []
            
            for f in formats:
                if f.get('vcodec') != 'none' and f.get('acodec') != 'none':
                    # Video with audio
                    quality = f.get('format_note', f.get('height', 'unknown'))
                    if isinstance(quality, int):
                        quality = f"{quality}p"
                    
                    video_formats.append({
                        'quality': quality,
                        'format': f.get('ext', 'mp4'),
                        'size': format_size(f.get('filesize') or f.get('filesize_approx', 0)),
                        'url': f.get('url', ''),
                        'width': f.get('width'),
                        'height': f.get('height'),
                        'fps': f.get('fps')
                    })
                elif f.get('acodec') != 'none' and f.get('vcodec') == 'none':
                    # Audio only
                    bitrate = f.get('abr', 128)
                    audio_formats.append({
                        'quality': f"{int(bitrate)}kbps",
                        'format': f.get('ext', 'mp3'),
                        'size': format_size(f.get('filesize') or f.get('filesize_approx', 0)),
                        'url': f.get('url', '')
                    })
            
            # Remove duplicates and sort
            video_formats = sorted(
                {v['quality']: v for v in video_formats}.values(),
                key=lambda x: x.get('height', 0),
                reverse=True
            )[:10]
            
            audio_formats = sorted(
                {a['quality']: a for a in audio_formats}.values(),
                key=lambda x: int(x['quality'].replace('kbps', '')),
                reverse=True
            )[:5]
            
            # Get thumbnail
            thumbnail = info.get('thumbnail', '')
            if not thumbnail and info.get('thumbnails'):
                thumbnail = info['thumbnails'][-1].get('url', '')
            
            return jsonify({
                'title': info.get('title', 'Video'),
                'thumbnail': thumbnail,
                'duration': format_duration(info.get('duration', 0)),
                'qualities': video_formats,
                'audioFormats': audio_formats,
                'platform': info.get('extractor_key', 'unknown').lower(),
                'uploader': info.get('uploader', ''),
                'views': info.get('view_count', 0)
            })
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'error': 'Failed to extract video',
            'message': str(e)
        }), 500

def format_size(bytes_size):
    if not bytes_size or bytes_size == 0:
        return 'Unknown'
    mb = bytes_size / (1024 * 1024)
    if mb < 1:
        return f"{bytes_size / 1024:.0f} KB"
    return f"{mb:.0f} MB"

def format_duration(seconds):
    if not seconds:
        return '0:00'
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins}:{secs:02d}"

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
