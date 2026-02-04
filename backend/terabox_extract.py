#!/usr/bin/env python3
"""
Terabox Video Extractor
Uses terabox-downloader Python library to extract direct download links
"""

import sys
import json
import os

def extract_terabox(url, cookie_string=None):
    """
    Extract Terabox file info and download link
    
    Args:
        url: Terabox share URL
        cookie_string: Cookie string in format "lang=en; ndus=xxx;"
    
    Returns:
        JSON with file info and download link
    """
    try:
        from TeraboxDL import TeraboxDL
    except ImportError:
        return {
            "success": False,
            "error": "TeraboxDL library not installed. Run: pip install terabox-downloader"
        }
    
    # Use provided cookie or environment variable
    cookie = cookie_string or os.environ.get('TERABOX_COOKIE', '')
    
    if not cookie:
        return {
            "success": False,
            "error": "Terabox requires authentication. Please provide cookie string.",
            "help": "Get cookies from browser: lang=en; ndus=YOUR_NDUS_VALUE;"
        }
    
    try:
        # Initialize TeraboxDL with cookie
        terabox = TeraboxDL(cookie)
        
        # Get file info
        file_info = terabox.get_file_info(url)
        
        # Check for errors
        if "error" in file_info:
            return {
                "success": False,
                "error": file_info["error"]
            }
        
        # Return formatted response
        return {
            "success": True,
            "title": file_info.get("file_name", "Terabox File"),
            "download_link": file_info.get("download_link"),
            "thumbnail": file_info.get("thumbnail", ""),
            "file_size": file_info.get("file_size", "Unknown"),
            "extractor": "terabox-python"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Terabox extraction failed: {str(e)}"
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python3 terabox_extract.py <url> [cookie_string]"
        }))
        sys.exit(1)
    
    url = sys.argv[1]
    cookie = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = extract_terabox(url, cookie)
    print(json.dumps(result, indent=2))
