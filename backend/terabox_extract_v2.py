#!/usr/bin/env python3
"""
Terabox Extractor v2 - Using terabox-downloader package
"""
import sys
import json

try:
    from terabox_downloader import TeraboxDL
except ImportError:
    print(json.dumps({
        "title": "Terabox File",
        "thumbnail": "https://via.placeholder.com/640x360",
        "duration": "0:00",
        "qualities": [],
        "audioFormats": [],
        "platform": "terabox",
        "extractionMethod": "terabox-failed",
        "error": "terabox-downloader package not installed"
    }))
    sys.exit(0)

def extract_terabox(url, cookies_string=None):
    """Extract Terabox file using terabox-downloader package"""
    try:
        # Initialize downloader
        downloader = TeraboxDL()
        
        # Get file info
        file_info = downloader.get_info(url)
        
        if not file_info:
            return {
                "title": "Terabox File",
                "thumbnail": "https://via.placeholder.com/640x360",
                "duration": "0:00",
                "qualities": [],
                "audioFormats": [],
                "platform": "terabox",
                "extractionMethod": "terabox-failed",
                "error": "Could not get file info"
            }
        
        # Extract download link
        download_link = file_info.get('download_link') or file_info.get('dlink') or file_info.get('url')
        
        if not download_link:
            return {
                "title": file_info.get('server_filename', 'Terabox File'),
                "thumbnail": "https://via.placeholder.com/640x360",
                "duration": "0:00",
                "qualities": [],
                "audioFormats": [],
                "platform": "terabox",
                "extractionMethod": "terabox-failed",
                "error": "No download link found"
            }
        
        # Format file size
        file_size = file_info.get('size', 0)
        if file_size:
            size_mb = file_size / (1024 * 1024)
            size_str = f"{size_mb:.2f} MB"
        else:
            size_str = "Unknown"
        
        # Return formatted response
        return {
            "title": file_info.get('server_filename', 'Terabox File'),
            "thumbnail": file_info.get('thumbs', {}).get('url3', 'https://via.placeholder.com/640x360') if isinstance(file_info.get('thumbs'), dict) else 'https://via.placeholder.com/640x360',
            "duration": "0:00",
            "qualities": [
                {
                    "quality": "Original",
                    "format": "mp4",
                    "size": size_str,
                    "url": download_link
                }
            ],
            "audioFormats": [],
            "platform": "terabox",
            "extractionMethod": "terabox-downloader-package"
        }
        
    except Exception as e:
        return {
            "title": "Terabox File",
            "thumbnail": "https://via.placeholder.com/640x360",
            "duration": "0:00",
            "qualities": [],
            "audioFormats": [],
            "platform": "terabox",
            "extractionMethod": "terabox-failed",
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        result = {
            "title": "Terabox File",
            "thumbnail": "https://via.placeholder.com/640x360",
            "duration": "0:00",
            "qualities": [],
            "audioFormats": [],
            "platform": "terabox",
            "extractionMethod": "terabox-failed",
            "error": "No URL provided"
        }
    else:
        url = sys.argv[1]
        cookies = sys.argv[2] if len(sys.argv) > 2 else None
        result = extract_terabox(url, cookies)
    
    print(json.dumps(result))
