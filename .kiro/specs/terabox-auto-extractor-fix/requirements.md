# Requirements Document

## Introduction

This document specifies the requirements for fixing the Terabox video downloader functionality in a React Native application. The current implementation uses a hidden WebView that loads a third-party website (terabox-download.com) and attempts to automatically extract video download links using JavaScript injection. However, the extraction fails because the JavaScript runs immediately after page load, before the third-party website has processed the Terabox link, resulting in incorrect URLs being extracted (website navigation links and logo images instead of actual video download URLs).

The fix must provide a 100% working solution that automatically extracts actual video download URLs without requiring manual user interaction, with improved debugging capabilities visible in the React Native console.

## Glossary

- **Terabox_Extractor**: The React Native component responsible for extracting video download URLs from Terabox share links
- **WebView**: The react-native-webview component that loads third-party downloader websites
- **Third_Party_API**: External web services or APIs that provide Terabox video download link extraction
- **Extraction_Method**: The technique used to obtain direct video download URLs (WebView scraping, API calls, or hybrid approaches)
- **Download_URL**: A direct HTTP/HTTPS link to a video file that can be downloaded
- **Share_Link**: A Terabox URL in the format https://terabox.com/s/[share_id] or similar variants
- **Backend_API**: The Node.js Express API endpoint at backend/api/extract.js that handles extraction logic
- **Debug_Log**: Console output messages that track the extraction process for troubleshooting

## Requirements

### Requirement 1: Automatic Video URL Extraction

**User Story:** As a user, I want to paste a Terabox share link and automatically receive the video download URL, so that I can download videos without manual interaction.

#### Acceptance Criteria

1. WHEN a user provides a valid Terabox Share_Link, THE Terabox_Extractor SHALL extract the actual video Download_URL automatically
2. WHEN extraction begins, THE Terabox_Extractor SHALL complete the process without requiring user interaction with the WebView
3. WHEN a Download_URL is extracted, THE Terabox_Extractor SHALL verify it points to a video file and not a website navigation link
4. WHEN extraction completes successfully, THE Terabox_Extractor SHALL return the Download_URL with video metadata (title, size, thumbnail)
5. IF extraction fails after all methods are exhausted, THEN THE Terabox_Extractor SHALL return a descriptive error message

### Requirement 2: Correct URL Validation

**User Story:** As a developer, I want the extractor to validate extracted URLs, so that only actual video download links are returned to users.

#### Acceptance Criteria

1. WHEN validating a URL, THE Terabox_Extractor SHALL reject URLs containing "/tools/", "/download-page", or hash fragments
2. WHEN validating a URL, THE Terabox_Extractor SHALL reject relative URLs that do not start with "http://" or "https://"
3. WHEN validating a URL, THE Terabox_Extractor SHALL accept URLs with video file extensions (mp4, mkv, avi, mov, webm, flv, m4v)
4. WHEN validating a URL, THE Terabox_Extractor SHALL accept URLs containing video-related keywords (download, dlink, stream, video, media, file, terabox)
5. WHEN a URL fails validation, THE Terabox_Extractor SHALL continue searching for valid URLs

### Requirement 3: Multiple Extraction Methods

**User Story:** As a system architect, I want multiple extraction methods with automatic fallback, so that the system remains reliable when individual methods fail.

#### Acceptance Criteria

1. WHEN the primary Extraction_Method fails, THE Terabox_Extractor SHALL automatically attempt the next available method
2. THE Backend_API SHALL attempt server-side Third_Party_API extraction before instructing the client to use WebView extraction
3. WHEN all server-side methods fail, THE Backend_API SHALL return a useWebView flag to trigger client-side WebView extraction
4. WHEN WebView extraction is triggered, THE Terabox_Extractor SHALL load the third-party downloader website and execute JavaScript extraction
5. THE system SHALL support at least three distinct Extraction_Methods (server-side API, WebView scraping, alternative APIs)

### Requirement 4: Enhanced Debugging and Logging

**User Story:** As a developer, I want detailed debug logs visible in the React Native console, so that I can troubleshoot extraction failures effectively.

#### Acceptance Criteria

1. WHEN extraction begins, THE Terabox_Extractor SHALL log the Share_Link being processed
2. WHEN the WebView loads, THE Terabox_Extractor SHALL log page load events (start, end, error)
3. WHEN JavaScript executes in the WebView, THE Terabox_Extractor SHALL log each extraction attempt with attempt number and method used
4. WHEN a URL is found, THE Terabox_Extractor SHALL log the URL and validation result
5. WHEN extraction completes or fails, THE Terabox_Extractor SHALL log the final result with success/failure status and error details
6. WHEN extraction times out, THE Terabox_Extractor SHALL log a sample of the page HTML for debugging

### Requirement 5: Timing and Synchronization

**User Story:** As a system designer, I want proper timing controls for WebView extraction, so that JavaScript waits for the third-party website to process the Terabox link before attempting extraction.

#### Acceptance Criteria

1. WHEN the WebView loads a third-party downloader page, THE Terabox_Extractor SHALL wait at least 3 seconds before starting extraction attempts
2. WHEN extraction attempts begin, THE Terabox_Extractor SHALL check for video URLs at 1-second intervals
3. WHEN 45 consecutive extraction attempts fail, THE Terabox_Extractor SHALL timeout and return an error
4. WHEN the page is still loading dynamic content, THE Terabox_Extractor SHALL continue checking until the timeout is reached
5. WHEN a valid Download_URL is found, THE Terabox_Extractor SHALL immediately stop checking and return the result

### Requirement 6: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when extraction fails, so that I understand what went wrong and what actions I can take.

#### Acceptance Criteria

1. WHEN extraction times out, THE Terabox_Extractor SHALL display "Could not find download link after N seconds. The file may be private or require authentication."
2. WHEN the WebView fails to load, THE Terabox_Extractor SHALL display "Failed to load downloader website"
3. WHEN all extraction methods fail, THE Backend_API SHALL return "Terabox extraction failed. The file may be private, expired, or require authentication."
4. WHEN an error occurs, THE system SHALL provide a "Try Again" option to retry extraction
5. WHEN an error occurs, THE system SHALL provide a "Go Back" option to return to the previous screen

### Requirement 7: Integration with Existing Download Flow

**User Story:** As a user, I want successful Terabox extractions to integrate seamlessly with the app's download flow, so that I can select quality and download videos like other platforms.

#### Acceptance Criteria

1. WHEN extraction succeeds, THE Terabox_Extractor SHALL format the result with title, downloadUrl, size, and thumbnail fields
2. WHEN extraction succeeds, THE system SHALL navigate to the preview screen with the extracted video information
3. WHEN displaying video information, THE system SHALL show the video title, file size in MB, and thumbnail image
4. WHEN the user selects a quality, THE system SHALL use the extracted Download_URL for downloading
5. THE extracted video information SHALL be compatible with the existing MediaInfo data structure used by other platforms

### Requirement 8: WebView Configuration

**User Story:** As a developer, I want the WebView properly configured for extraction, so that third-party websites load correctly and JavaScript executes reliably.

#### Acceptance Criteria

1. THE WebView SHALL enable JavaScript execution
2. THE WebView SHALL enable DOM storage
3. THE WebView SHALL disable caching to ensure fresh page loads
4. THE WebView SHALL use incognito mode to avoid cookie conflicts
5. THE WebView SHALL use a mobile user agent string to ensure mobile-optimized pages load
6. THE WebView SHALL be visually hidden from the user (opacity: 0) while showing a loading indicator

### Requirement 9: Backend API Coordination

**User Story:** As a system architect, I want the backend API to coordinate extraction methods intelligently, so that the most reliable method is used first.

#### Acceptance Criteria

1. WHEN a Terabox URL is detected, THE Backend_API SHALL first attempt extraction using terabox.hnn.workers.dev API
2. IF the first API fails, THEN THE Backend_API SHALL attempt extraction using teraboxdownloader.com API
3. IF the second API fails, THEN THE Backend_API SHALL attempt extraction using playterabox.com API
4. IF all server-side APIs fail, THEN THE Backend_API SHALL return useWebView: true to trigger client-side WebView extraction
5. THE Backend_API SHALL log each extraction attempt with method name and success/failure status

### Requirement 10: Performance and Timeout Management

**User Story:** As a user, I want extraction to complete within a reasonable time, so that I don't wait indefinitely for results.

#### Acceptance Criteria

1. WHEN using server-side APIs, THE Backend_API SHALL timeout each API request after 20 seconds
2. WHEN using WebView extraction, THE Terabox_Extractor SHALL timeout after 45 seconds of unsuccessful attempts
3. WHEN extraction completes successfully, THE system SHALL return results within 10 seconds for 90% of requests
4. WHEN a timeout occurs, THE system SHALL immediately display an error message without additional waiting
5. THE system SHALL allow users to cancel extraction at any time by pressing a Cancel button
