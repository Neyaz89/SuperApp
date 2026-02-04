#!/usr/bin/env python3
"""
Terabox Video Extractor - Direct API Approach
Extracts download links from Terabox without external libraries
"""

import sys
import json
import re
import urllib.request
import urllib.parse
from http.cookiejar import CookieJar

def extract_terabox(url, cookie_string=None):
    """
    Extract Terabox file info and download link using direct API calls
    
    Args:
        url: Terabox share URL
        cookie_string: Cookie string in format "lang=en; ndus=xxx;"
    
    Returns:
        JSON with file info and download link
    """
    
    # Parse cookies
    cookies = {}
    if cookie_string:
        for cookie in cookie_string.split(';'):
            cookie = cookie.strip()
            if '=' in cookie:
                key, value = cookie.split('=', 1)
                cookies[key.strip()] = value.strip()
    
    if not cookies.get('ndus'):
        return {
            "success": False,
            "error": "Terabox requires 'ndus' cookie for authentication"
        }
    
    try:
        # Extract share ID from URL
        # Supports: terabox.com/s/xxx, teraboxapp.com/s/xxx, 1024tera.com/s/xxx
        match = re.search(r'/s/([a-zA-Z0-9_-]+)', url)
        if not match:
            return {
                "success": False,
                "error": "Invalid Terabox URL format"
            }
        
        share_id = match.group(1)
        
        # Build API request
        api_url = f"https://www.terabox.com/share/list?shorturl={share_id}&root=1"
        
        # Prepare headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Cookie': cookie_string or '',
            'Referer': url
        }
        
        # Make request
        req = urllib.request.Request(api_url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        # Check response
        if data.get('errno') != 0:
            error_msg = data.get('errmsg', 'Unknown error')
            return {
                "success": False,
                "error": f"Terabox API error: {error_msg}"
            }
        
        # Extract file list
        file_list = data.get('list', [])
        if not file_list:
            return {
                "success": False,
                "error": "No files found in share link"
            }
        
        # Get first file
        file_info = file_list[0]
        
        # Get download link
        fs_id = file_info.get('fs_id')
        if not fs_id:
            return {
                "success": False,
                "error": "Could not extract file ID"
            }
        
        # Build download URL
        download_url = f"https://www.terabox.com/share/download?shareid={data.get('shareid')}&uk={data.get('uk')}&fid={fs_id}"
        
        # Return success
        return {
            "success": True,
            "title": file_info.get('server_filename', 'Terabox File'),
            "download_link": download_url,
            "thumbnail": file_info.get('thumbs', {}).get('url3', ''),
            "file_size": format_bytes(file_info.get('size', 0)),
            "extractor": "terabox-direct-api"
        }
        
    except urllib.error.HTTPError as e:
        return {
            "success": False,
            "error": f"HTTP error {e.code}: {e.reason}"
        }
    except urllib.error.URLError as e:
        return {
            "success": False,
            "error": f"Network error: {str(e.reason)}"
        }
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Invalid JSON response: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Extraction error: {str(e)}"
        }

def format_bytes(bytes_size):
    """Format bytes to human readable size"""
    try:
        bytes_size = int(bytes_size)
        if bytes_size == 0:
            return "0 B"
        
        units = ['B', 'KB', 'MB', 'GB', 'TB']
        i = 0
        while bytes_size >= 1024 and i < len(units) - 1:
            bytes_size /= 1024.0
            i += 1
        
        return f"{bytes_size:.2f} {units[i]}"
    except:
        return "Unknown"

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            result = {
                "success": False,
                "error": "Usage: python3 terabox_extract.py <url> [cookie_string]"
            }
        else:
            url = sys.argv[1]
            cookie = sys.argv[2] if len(sys.argv) > 2 else None
            result = extract_terabox(url, cookie)
        
        # Output only JSON
        print(json.dumps(result))
        
    except Exception as e:
        # Always output valid JSON
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
