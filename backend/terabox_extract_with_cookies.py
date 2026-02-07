#!/usr/bin/env python3
"""
Terabox Extractor with Cookie Authentication
Extracts download links from Terabox using authenticated API calls
"""

import sys
import json
import re
import urllib.request
import urllib.parse
import http.cookiejar

def load_cookies_from_file(cookie_file):
    """Load cookies from Netscape format file"""
    cookie_jar = http.cookiejar.MozillaCookieJar(cookie_file)
    try:
        cookie_jar.load(ignore_discard=True, ignore_expires=True)
        return cookie_jar
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Failed to load cookies: {str(e)}"
        }), file=sys.stderr)
        return None

def extract_terabox_with_cookies(url, cookie_file):
    """
    Extract Terabox file using authenticated API with cookies
    """
    try:
        # Extract share ID
        match = re.search(r'/s/([a-zA-Z0-9_-]+)', url)
        if not match:
            return {
                "success": False,
                "error": "Invalid Terabox URL"
            }
        
        share_id = match.group(1)
        
        # Load cookies
        cookie_jar = load_cookies_from_file(cookie_file)
        if not cookie_jar:
            return {
                "success": False,
                "error": "Failed to load cookies"
            }
        
        # Create opener with cookies
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
        urllib.request.install_opener(opener)
        
        # Step 1: Get file info from Terabox API
        info_url = f"https://www.1024terabox.com/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&shorturl={share_id}&root=1"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': url,
            'Origin': 'https://www.1024terabox.com'
        }
        
        req = urllib.request.Request(info_url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=20) as response:
            info_data = json.loads(response.read().decode('utf-8'))
        
        # Check response
        if info_data.get('errno') != 0:
            return {
                "success": False,
                "error": f"API error: {info_data.get('errmsg', 'Unknown error')}"
            }
        
        if not info_data.get('list') or len(info_data['list']) == 0:
            return {
                "success": False,
                "error": "No files found"
            }
        
        file_info = info_data['list'][0]
        
        # Step 2: Get download link
        download_url = f"https://www.1024terabox.com/share/download?app_id=250528&web=1&channel=dubox&clienttype=0&sign={info_data['sign']}&timestamp={info_data['timestamp']}&shareid={info_data['shareid']}&uk={info_data['uk']}&primaryid={info_data['shareid']}&fid_list=[{file_info['fs_id']}]"
        
        download_req = urllib.request.Request(download_url, headers=headers)
        
        with urllib.request.urlopen(download_req, timeout=20) as response:
            download_data = json.loads(response.read().decode('utf-8'))
        
        # Extract download link
        dlink = None
        if download_data.get('list') and len(download_data['list']) > 0:
            dlink = download_data['list'][0].get('dlink')
        
        if not dlink:
            return {
                "success": False,
                "error": "No download link in response"
            }
        
        # Format file size
        file_size = file_info.get('size', 0)
        size_mb = file_size / (1024 * 1024)
        
        return {
            "success": True,
            "title": file_info.get('server_filename', 'Terabox File'),
            "download_link": dlink,
            "thumbnail": file_info.get('thumbs', {}).get('url3', '') if isinstance(file_info.get('thumbs'), dict) else '',
            "file_size": f"{size_mb:.2f} MB",
            "size_bytes": file_size,
            "extractor": "terabox-authenticated"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Extraction failed: {str(e)}"
        }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 3:
            result = {
                "success": False,
                "error": "Usage: python3 terabox_extract_with_cookies.py <url> <cookie_file>"
            }
        else:
            url = sys.argv[1]
            cookie_file = sys.argv[2]
            result = extract_terabox_with_cookies(url, cookie_file)
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
