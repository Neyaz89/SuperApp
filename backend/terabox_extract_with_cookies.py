#!/usr/bin/env python3
"""
Terabox Extractor with Cookie Authentication
Extracts download links from Terabox using authenticated API calls
"""

import sys
import json
import re
import http.cookiejar
import ssl

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request
    import urllib.parse

def load_cookies_from_file(cookie_file):
    """Load cookies from Netscape format file"""
    cookie_jar = http.cookiejar.MozillaCookieJar(cookie_file)
    try:
        cookie_jar.load(ignore_discard=True, ignore_expires=True)
        return cookie_jar
    except Exception as e:
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
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': url,
            'Origin': 'https://www.1024terabox.com',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        }
        
        # Try multiple Terabox domains
        domains = [
            'www.1024terabox.com',
            'www.terabox.com',
            'www.teraboxapp.com'
        ]
        
        for domain in domains:
            try:
                # Step 1: Get file info
                info_url = f"https://{domain}/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&shorturl={share_id}&root=1"
                
                if HAS_REQUESTS:
                    # Use requests library (better SSL handling)
                    session = requests.Session()
                    
                    # Convert cookie jar to requests format
                    for cookie in cookie_jar:
                        session.cookies.set(cookie.name, cookie.value, domain=cookie.domain, path=cookie.path)
                    
                    response = session.get(info_url, headers=headers, timeout=30, verify=False)
                    info_data = response.json()
                else:
                    # Fallback to urllib with custom SSL context
                    ctx = ssl.create_default_context()
                    ctx.check_hostname = False
                    ctx.verify_mode = ssl.CERT_NONE
                    
                    opener = urllib.request.build_opener(
                        urllib.request.HTTPCookieProcessor(cookie_jar),
                        urllib.request.HTTPSHandler(context=ctx)
                    )
                    
                    req = urllib.request.Request(info_url, headers=headers)
                    with opener.open(req, timeout=30) as response:
                        info_data = json.loads(response.read().decode('utf-8'))
                
                # Check response
                if info_data.get('errno') != 0:
                    continue
                
                if not info_data.get('list') or len(info_data['list']) == 0:
                    continue
                
                file_info = info_data['list'][0]
                
                # Step 2: Get download link
                download_url = f"https://{domain}/share/download?app_id=250528&web=1&channel=dubox&clienttype=0&sign={info_data['sign']}&timestamp={info_data['timestamp']}&shareid={info_data['shareid']}&uk={info_data['uk']}&primaryid={info_data['shareid']}&fid_list=[{file_info['fs_id']}]"
                
                if HAS_REQUESTS:
                    download_response = session.get(download_url, headers=headers, timeout=30, verify=False)
                    download_data = download_response.json()
                else:
                    download_req = urllib.request.Request(download_url, headers=headers)
                    with opener.open(download_req, timeout=30) as response:
                        download_data = json.loads(response.read().decode('utf-8'))
                
                # Extract download link
                dlink = None
                if download_data.get('list') and len(download_data['list']) > 0:
                    dlink = download_data['list'][0].get('dlink')
                
                if not dlink:
                    continue
                
                # Success!
                file_size = file_info.get('size', 0)
                size_mb = file_size / (1024 * 1024)
                
                return {
                    "success": True,
                    "title": file_info.get('server_filename', 'Terabox File'),
                    "download_link": dlink,
                    "thumbnail": file_info.get('thumbs', {}).get('url3', '') if isinstance(file_info.get('thumbs'), dict) else '',
                    "file_size": f"{size_mb:.2f} MB",
                    "size_bytes": file_size,
                    "extractor": f"terabox-authenticated-{domain}"
                }
                
            except Exception as e:
                # Try next domain
                continue
        
        # All domains failed
        return {
            "success": False,
            "error": "All Terabox domains failed. File may be private or require different authentication."
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
