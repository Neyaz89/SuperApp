#!/usr/bin/env python3
"""
Terabox Video Extractor - Using Public API
Extracts download links from Terabox using Cloudflare Worker API
"""

import sys
import json
import re
import urllib.request
import urllib.parse

def extract_terabox(url, cookie_string=None):
    """
    Extract Terabox file info and download link using public API
    
    Args:
        url: Terabox share URL
        cookie_string: Not needed for this method
    
    Returns:
        JSON with file info and download link
    """
    
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
        
        # Step 1: Get file info from Cloudflare Worker API
        api_url = f"https://terabox.hnn.workers.dev/api/get-info?shorturl={share_id}&pwd="
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        }
        
        req = urllib.request.Request(api_url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=15) as response:
            info_data = json.loads(response.read().decode('utf-8'))
        
        # Check if we got file info
        if not info_data.get('list') or len(info_data['list']) == 0:
            return {
                "success": False,
                "error": "No files found in share link"
            }
        
        file_info = info_data['list'][0]
        
        # Step 2: Get download link
        download_api_url = "https://terabox.hnn.workers.dev/api/get-download"
        
        post_data = json.dumps({
            'shareid': info_data['shareid'],
            'uk': info_data['uk'],
            'sign': info_data['sign'],
            'timestamp': info_data['timestamp'],
            'fs_id': file_info['fs_id']
        }).encode('utf-8')
        
        download_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'https://terabox.hnn.workers.dev',
            'Referer': 'https://terabox.hnn.workers.dev/'
        }
        
        download_req = urllib.request.Request(
            download_api_url,
            data=post_data,
            headers=download_headers,
            method='POST'
        )
        
        with urllib.request.urlopen(download_req, timeout=15) as response:
            download_data = json.loads(response.read().decode('utf-8'))
        
        # Extract download link
        download_link = download_data.get('downloadLink')
        
        if not download_link:
            return {
                "success": False,
                "error": "Could not get download link from API"
            }
        
        # Return success
        return {
            "success": True,
            "title": file_info.get('server_filename', 'Terabox File'),
            "download_link": download_link,
            "thumbnail": file_info.get('thumbs', {}).get('url3', '') if isinstance(file_info.get('thumbs'), dict) else '',
            "file_size": format_bytes(file_info.get('size', 0)),
            "extractor": "terabox-cloudflare-api"
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
    except KeyError as e:
        return {
            "success": False,
            "error": f"Missing required field in API response: {str(e)}"
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
