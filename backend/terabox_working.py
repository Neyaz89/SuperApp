#!/usr/bin/env python3
"""
Working Terabox Extractor using terabox-downloader package
"""

import sys
import json
import re

try:
    from TeraboxDL import TeraboxDL
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "terabox-downloader package not installed. Run: pip install terabox-downloader"
    }))
    sys.exit(1)

def extract_cookies_from_file(cookie_file):
    """Extract ndus and lang cookies from Netscape format file"""
    try:
        ndus = None
        lang = None
        
        with open(cookie_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                parts = line.split('\t')
                if len(parts) >= 7:
                    cookie_name = parts[5]
                    cookie_value = parts[6]
                    
                    if cookie_name == 'ndus':
                        ndus = cookie_value
                    elif cookie_name == 'lang':
                        lang = cookie_value
        
        if not ndus:
            return None, "ndus cookie not found in cookie file"
        
        # Build cookie string
        cookie_string = f"lang={lang or 'en'}; ndus={ndus};"
        return cookie_string, None
        
    except Exception as e:
        return None, f"Failed to read cookie file: {str(e)}"

def extract_terabox(url, cookie_file):
    """
    Extract Terabox file using terabox-downloader package
    """
    try:
        # Extract cookies
        cookie_string, error = extract_cookies_from_file(cookie_file)
        if error:
            return {
                "success": False,
                "error": error
            }
        
        # Create TeraboxDL instance
        terabox = TeraboxDL(cookie_string)
        
        # Get file info
        file_info = terabox.get_file_info(url)
        
        # Check for errors
        if "error" in file_info:
            return {
                "success": False,
                "error": file_info["error"]
            }
        
        # Return success
        return {
            "success": True,
            "title": file_info.get("file_name", "Terabox File"),
            "download_link": file_info.get("download_link", ""),
            "thumbnail": file_info.get("thumbnail", ""),
            "file_size": file_info.get("file_size", "Unknown"),
            "size_bytes": file_info.get("sizebytes", 0),
            "extractor": "terabox-downloader-package"
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
                "error": "Usage: python3 terabox_working.py <url> <cookie_file>"
            }
        else:
            url = sys.argv[1]
            cookie_file = sys.argv[2]
            result = extract_terabox(url, cookie_file)
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Script error: {str(e)}"
        }))
