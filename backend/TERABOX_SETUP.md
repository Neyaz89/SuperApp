# Terabox Setup Guide

## Why Terabox Needs Cookies

Terabox requires authentication to download files. You need to provide your browser cookies to bypass this.

## How to Get Terabox Cookies

### Method 1: Using Microsoft Edge (Recommended)

1. **Open Edge browser** and log in to your Terabox account at https://www.terabox.com
2. **Click the padlock icon** next to the URL in the address bar
3. **Click "Permissions for this site"**
4. **Click "Cookies and site data"**
5. **Click "Cookies (X cookies in use)"** to open the cookies viewer
6. **Under the terabox.com domain**, expand the Cookies section
7. **Look for these cookies:**
   - `lang` (language setting)
   - `ndus` (authentication token)
8. **Copy their values** and combine them in this format:

```
lang=en; ndus=YOUR_NDUS_VALUE_HERE;
```

### Method 2: Using Chrome DevTools

1. **Open Chrome** and log in to Terabox
2. **Press F12** to open DevTools
3. **Go to Application tab** → Cookies → https://www.terabox.com
4. **Find and copy** the `lang` and `ndus` cookie values
5. **Format as:** `lang=en; ndus=YOUR_VALUE;`

### Method 3: Using Firefox

1. **Open Firefox** and log in to Terabox
2. **Press F12** → Storage tab → Cookies
3. **Find terabox.com** cookies
4. **Copy `lang` and `ndus` values**
5. **Format as:** `lang=en; ndus=YOUR_VALUE;`

## How to Add Cookies to Backend

### Option 1: Environment Variable (Recommended for Render.com)

1. Go to your Render.com dashboard
2. Select your service
3. Go to **Environment** tab
4. Add new environment variable:
   - **Key:** `TERABOX_COOKIE`
   - **Value:** `lang=en; ndus=YOUR_NDUS_VALUE;`
5. Save and redeploy

### Option 2: Cookie File (For Docker/Local)

1. Create a file named `terabox_cookies.txt` in the backend folder
2. Add your cookie string:
```
lang=en; ndus=YOUR_NDUS_VALUE;
```
3. Save the file
4. Rebuild and redeploy

## Example Cookie Format

```
lang=en; ndus=Y2FsbGJhY2s9aHR0cHMlM0ElMkYlMkZ3d3cudGVyYWJveC5jb20lMkZtYWluJTNGY2F0ZWdvcnklM0RhbGwmZ3RtX3V0bV9tZWRpdW09ZnJlZSZuZHV0X2ZtdD1ZMkZzYkdKaFkyczlhSFIwY0hNbE0wRWxNa1lsTWtaM2QzY3VkR1Z5WVdKdmVDNWpiMjBsTWtadFlXbHVKVE5HWTJGMFpXZHZjbmtsUTBRbE0wUmhiR3dtWjNSdFgzVjBiVjl0WldScGRXMDlabkpsWlNadVpIVjBYMlp0ZEQxWk1tTmhiR3hpWVdOclBXaDBkSEJ6SlRORkpUSkdKVEpHZDNkM0xuUmxjbUZpYjNndVkyOXRKVEpHYldGcGJpVXpSbU5oZEdWbmIzSjVKVE5FWVd4c0ptZDBiVjkxZEcxZmJXVmthWFZ0UFdaeVpXVW1ibVIxZEY5bWJYUTlXVEpqWVd4c1ltRmphejFvZEhSd2N5VXpSU1V5UmlVeVJuZDNkeTUwWlhKaFltOTRMbU52YlNVeVJtMWhhVzRsTTBabVkyRjBaV2R2Y25rbE0wUmhiR3dtWjNSdFgzVjBiVjl0WldScGRXMDlabkpsWlNadVpIVjBYMlp0ZEQxWk1tTmhiR3hpWVdOclBXaDBkSEJ6SlRORkpUSkdKVEpHZDNkM0xuUmxjbUZpYjNndVkyOXRKVEpHYldGcGJpVXpSbU5oZEdWbmIzSjVKVE5FWVd4cyZuZHVzX3RpbWVzdGFtcD0xNzM4NjU0MzIx;
```

## Testing Terabox

After adding cookies, test with a Terabox share link:

```
https://teraboxapp.com/s/1PDAUak5v6Ai3o6iTp8k_Ow
```

## Troubleshooting

### "Terabox requires authentication"
- Make sure you've added the cookie correctly
- Check that the cookie format is: `lang=en; ndus=VALUE;`
- Ensure there are no extra spaces or line breaks

### "Cookie expired"
- Terabox cookies expire after some time
- Log in to Terabox again and get fresh cookies
- Update the environment variable or file

### "File not found"
- The shared link may be private or deleted
- Make sure the link is publicly accessible
- Try opening the link in your browser first

## Security Notes

⚠️ **IMPORTANT:**
- Never share your `ndus` cookie value publicly
- It's like your password - keep it secret
- Rotate cookies periodically for security
- Use environment variables instead of committing to git

## Cookie Lifespan

- Terabox cookies typically last 30-90 days
- You'll need to refresh them when they expire
- Set a reminder to update cookies monthly

## Production Deployment

For production on Render.com:
1. Add `TERABOX_COOKIE` environment variable
2. Keep cookies updated
3. Monitor logs for authentication errors
4. Have a backup cookie ready

## Support

If you're getting 10k daily users from Terabox:
- Consider getting multiple Terabox accounts
- Rotate cookies to distribute load
- Monitor rate limits
- Have fallback cookies ready
