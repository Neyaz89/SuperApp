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
                    # Success! Return the info
                    result = {
                        'success': True,
                        'extractor': extractor['name'],
                        'title': info.get('title', 'Video'),
                        'thumbnail': info.get('thumbnail', ''),
                        'duration': info.get('duration', 0),
                        'formats': []
                    }
                    
                    # Extract format info
                    for fmt in info['formats']:
                        if fmt.get('url'):
                            result['formats'].append({
                                'format_id': fmt.get('format_id', ''),
                                'ext': fmt.get('ext', 'mp4'),
                                'quality': fmt.get('format_note', ''),
                                'height': fmt.get('height', 0),
                                'width': fmt.get('width', 0),
                                'filesize': fmt.get('filesize', 0),
                                'vcodec': fmt.get('vcodec', 'none'),
                                'acodec': fmt.get('acodec', 'none'),
                                'url': fmt.get('url', '')
                            })
                    
                    return result
                    
        except Exception as e:
            # Try next extractor
            continue
    
    # All extractors failed
    return {
        'success': False,
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
