# Oppo Store Individual Developer Account Setup

## Overview

Oppo Store (also known as ColorOS App Market) is one of the major Android app stores in Asia, particularly popular in China, India, and Southeast Asia.

## Account Registration

### 1. Visit Oppo Developer Portal

**URL:** https://open.oppomobile.com/

**Alternative URLs:**
- Global: https://open.oppomobile.com/
- China: https://open.oppomobile.com/cn/

### 2. Create Account

1. Click **"Register"** or **"Sign Up"**
2. Choose **"Individual Developer"** account type
3. Fill in registration details:
   - Email address
   - Password
   - Phone number (with country code)
   - Verification code

### 3. Complete Profile

After registration, complete your developer profile:

#### Personal Information:
- Full Name (as per ID)
- Country/Region
- ID Type (Passport, National ID, etc.)
- ID Number
- ID Photo (front and back)

#### Contact Information:
- Email (verified)
- Phone number (verified)
- Address

#### Developer Information:
- Developer Name (public-facing)
- Developer Description
- Website (optional)
- Social media links (optional)

### 4. Verification Process

**Documents Required:**
- Government-issued ID (Passport or National ID)
- Selfie holding ID
- Proof of address (utility bill, bank statement)

**Verification Time:** 1-3 business days

**Verification Fee:** Usually free for individual developers

## Account Features

### Individual Developer Account Includes:
✅ Unlimited app submissions
✅ Access to Oppo Store analytics
✅ In-app purchase support
✅ Push notification services
✅ App update management
✅ User review management

### Limitations:
❌ No company branding
❌ Limited marketing support
❌ May have lower visibility than company accounts

## App Submission Requirements

### Technical Requirements:
- **APK Size:** Max 2GB
- **Min SDK:** Android 5.0 (API 21) or higher
- **Target SDK:** Latest Android version recommended
- **Signing:** Must be signed with your keystore

### Content Requirements:
- App icon (512x512px PNG)
- Screenshots (at least 3, max 8)
- App description (Chinese and English)
- Privacy policy URL
- Terms of service URL

### Compliance:
- No prohibited content
- Proper permissions usage
- Privacy policy compliance
- Age rating declaration

## Fees

### Registration:
- **Individual Account:** FREE

### Revenue Share:
- **Paid Apps:** 30% commission (you get 70%)
- **In-App Purchases:** 30% commission (you get 70%)
- **Free Apps:** No fees

### Payment:
- Minimum payout: $100 USD
- Payment methods: Bank transfer, PayPal
- Payment cycle: Monthly

## App Submission Process

### 1. Prepare Your App

```bash
# Build production APK
eas build --platform android --profile production
```

### 2. Login to Developer Console

Go to: https://open.oppomobile.com/console

### 3. Create New App

1. Click **"Create App"** or **"Submit App"**
2. Fill in app details:
   - App name
   - Package name (com.superhub.media)
   - Category
   - Age rating
   - Description

### 4. Upload APK

1. Upload your signed APK
2. Provide keystore information:
   - Keystore file (.jks)
   - Keystore password
   - Key alias
   - Key password

### 5. Add App Assets

- App icon (512x512px)
- Screenshots (1080x1920px recommended)
- Feature graphic (optional)
- Promotional video (optional)

### 6. Set Pricing

- Free or Paid
- In-app purchases (if any)
- Regional pricing

### 7. Submit for Review

**Review Time:** 1-3 business days

**Review Criteria:**
- Technical functionality
- Content compliance
- Security checks
- Performance testing

## SuperHub App Submission

### App Details for SuperHub:

**App Name:** SuperHub

**Package Name:** com.superhub.media

**Category:** Tools / Multimedia

**Description:**
```
SuperHub - All-in-One Media Downloader & Entertainment Hub

Download videos from 1000+ websites including YouTube, Instagram, Facebook, TikTok, and more. Plus enjoy 24+ built-in ad-free games!

Features:
• Video downloader for 1000+ platforms
• High-quality video downloads
• Multiple format support
• Video compression
• 24+ premium ad-free games
• Clean, modern interface
• Fast and reliable

Perfect for saving your favorite videos and enjoying casual gaming!
```

**Keywords:**
video downloader, media downloader, youtube downloader, instagram downloader, tiktok downloader, games, entertainment

**Age Rating:** 12+ (Teen)

**Privacy Policy:** [Your privacy policy URL]

**Support Email:** [Your support email]

### Required Assets:

1. **App Icon:** 512x512px (use your rocket logo)
2. **Screenshots:** 
   - Home screen
   - Video download screen
   - Games section
   - Download complete screen
   - At least 3-8 screenshots

3. **Feature Graphic:** 1024x500px (optional but recommended)

## Post-Submission

### After Approval:

1. **Monitor Analytics:**
   - Downloads
   - Active users
   - Crash reports
   - User reviews

2. **Respond to Reviews:**
   - Reply to user feedback
   - Address issues promptly

3. **Update Regularly:**
   - Bug fixes
   - New features
   - Security updates

### Update Process:

1. Build new version with incremented version code
2. Upload new APK
3. Provide changelog
4. Submit for review

## Tips for Success

### Increase Visibility:
✅ Use relevant keywords
✅ High-quality screenshots
✅ Detailed description
✅ Regular updates
✅ Respond to reviews
✅ Localize for Chinese market

### Avoid Rejection:
❌ Don't use copyrighted content
❌ Don't mislead users
❌ Don't request unnecessary permissions
❌ Don't include malware or ads in violation
❌ Don't violate content policies

## Support & Resources

### Developer Support:
- **Email:** developer@oppo.com
- **Forum:** https://open.oppomobile.com/community
- **Documentation:** https://open.oppomobile.com/wiki

### Useful Links:
- Developer Console: https://open.oppomobile.com/console
- App Guidelines: https://open.oppomobile.com/wiki/doc#id=10159
- SDK Documentation: https://open.oppomobile.com/wiki/doc#id=10291

## Comparison with Other Stores

| Feature | Oppo Store | Google Play | IndusAppStore |
|---------|-----------|-------------|---------------|
| Registration Fee | Free | $25 one-time | Free |
| Review Time | 1-3 days | 1-7 days | 1-2 days |
| Revenue Share | 70/30 | 70/30 | 80/20 |
| Market | Asia | Global | India |
| Requirements | Moderate | Strict | Moderate |

## Checklist

Before submitting to Oppo Store:

- [ ] Individual developer account created and verified
- [ ] App built and signed with keystore
- [ ] App icon prepared (512x512px)
- [ ] Screenshots prepared (at least 3)
- [ ] App description written (English & Chinese)
- [ ] Privacy policy URL ready
- [ ] Support email configured
- [ ] Age rating determined
- [ ] Pricing set (free/paid)
- [ ] Keystore credentials ready
- [ ] App tested on Oppo devices (if possible)

---

*Last Updated: February 14, 2026*
*Account Type: Individual Developer*
*Status: Registration Guide*
