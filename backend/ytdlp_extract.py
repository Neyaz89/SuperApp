#!/usr/bin/env python3
import yt_dlp
import json
import sys

def extract_video(url, cookies_file=None):
    """Extract video info using yt-dlp Python library"""
    
    # Base options
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
        'no_check_certificate': True,
        'nocheckcertificate': True,
    }
    
    # Add cookies if provided
    if cookies_file:
        ydl_opts['cookiefile'] = cookies_file
    
    # Try different extractors in order
    extractors = [
        {'name': 'ios', 'client': 'ios'},
        {'name': 'android', 'client': 'android'},
        {'name': 'mweb', 'client': 'mweb'},
        {'name': 'web', 'client': 'web'},
        {'name': 'tv_embedded', 'client': 'tv_embedded'},
    ]
    
    for extractor in extractors:
        try:
            # Set player client
            ydl_opts['extractor_args'] = {
                'youtube': {
                    'player_client': [extractor['client']]
                }
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if info and 'formats' in info and len(info['formats']) > 0:
                    # Success! Return the info in the correct format
                    formats = []
                    
                    # Extract format info
                    for fmt in info['formats']:
                        if fmt.get('url'):
                            formats.append({
                                'format_id': fmt.get('format_id', ''),
                                'ext': fmt.get('ext', 'mp4'),
                                'quality': fmt.get('format_note', ''),
                                'height': fmt.get('height', 0),
                                'width': fmt.get('width', 0),
                                'filesize': fmt.get('filesize', 0),
                                'vcodec': fmt.get('vcodec', 'none'),
                                'acodec': fmt.get('acodec', 'none'),
                                'url': fmt.get('url', ''),
                                'abr': fmt.get('abr', 0)
                            })
                    
                    # Format duration
                    duration_seconds = info.get('duration', 0)
                    if duration_seconds:
                        mins = int(duration_seconds // 60)
                        secs = int(duration_seconds % 60)
                        duration_str = f"{mins}:{secs:02d}"
                    else:
                        duration_str = "0:00"
                    
                    # Build response in expected format
                    result = {
                        'title': info.get('title', 'Video'),
                        'thumbnail': info.get('thumbnail', 'https://via.placeholder.com/640x360'),
                        'duration': duration_str,
                        'qualities': [],
                        'audioFormats': [],
                        'platform': 'youtube',
                        'extractionMethod': f'yt-dlp-{extractor["name"]}'
                    }
                    
                    # Separate video and audio formats
                    video_formats = [f for f in formats if f['vcodec'] != 'none' and f['url']]
                    audio_formats = [f for f in formats if f['vcodec'] == 'none' and f['acodec'] != 'none' and f['url']]
                    
                    # Sort video formats by height (quality)
                    video_formats.sort(key=lambda x: x['height'] or 0, reverse=True)
                    
                    # Build qualities list (top 5)
                    for fmt in video_formats[:5]:
                        quality_label = f"{fmt['height']}p" if fmt['height'] else (fmt['quality'] or 'Unknown')
                        size_mb = f"{fmt['filesize'] / (1024*1024):.2f} MB" if fmt['filesize'] else 'Unknown'
                        
                        result['qualities'].append({
                            'quality': quality_label,
                            'format': fmt['ext'] or 'mp4',
                            'size': size_mb,
                            'url': fmt['url'],
                            'hasAudio': fmt['acodec'] != 'none',
                            'hasVideo': fmt['vcodec'] != 'none'
                        })
                    
                    # Build audio formats list (top 3)
                    audio_formats.sort(key=lambda x: x['abr'] or 0, reverse=True)
                    for fmt in audio_formats[:3]:
                        quality_label = f"{int(fmt['abr'])}kbps" if fmt['abr'] else '128kbps'
                        size_mb = f"{fmt['filesize'] / (1024*1024):.2f} MB" if fmt['filesize'] else 'Unknown'
                        
                        result['audioFormats'].append({
                            'quality': quality_label,
                            'format': fmt['ext'] or 'mp3',
                            'size': size_mb,
                            'url': fmt['url']
                        })
                    
                    return result
                    
        except Exception as e:
            # Try next extractor
            continue
    
    # All extractors failed
    return {
        'title': 'Video',
        'thumbnail': 'https://via.placeholder.com/640x360',
        'duration': '0:00',
        'qualities': [],
        'audioFormats': [],
        'platform': 'youtube',
        'extractionMethod': 'yt-dlp-failed',
        'error': 'All extractors failed'
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No URL provided'}))
        sys.exit(1)
    
    url = sys.argv[1]
    cookies_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = extract_video(url, cookies_file)
    print(json.dumps(result))
