# YouTube Transcript Fetcher - Installation Guide

## Quick Install (Recommended)

### Method 1: Firefox Developer Edition
1. Download [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/)
2. Open Firefox Developer Edition
3. Go to `about:debugging`
4. Click "This Firefox"
5. Click "Load Temporary Add-on"
6. Select the `youtube_transcript_fetcher-1.0.0.zip` file from the `web-ext-artifacts` folder
7. The extension will remain installed permanently in Developer Edition

### Method 2: Regular Firefox (Requires Settings Change)
1. Open Firefox
2. Go to `about:config` (accept the warning)
3. Search for `xpinstall.signatures.required`
4. Double-click to set it to `false`
5. Go to `about:addons`
6. Click the gear icon (⚙️) → "Install Add-on From File"
7. Select the `youtube_transcript_fetcher-1.0.0.zip` file

## For Distribution (Advanced)

### Submit to Mozilla Add-ons (AMO)
1. Create account at [addons.mozilla.org](https://addons.mozilla.org/developers/)
2. Submit the extension for review
3. Once approved, users can install it normally

### Self-Distribution with Signing
1. Get API credentials from Mozilla
2. Use web-ext to sign:
   ```bash
   web-ext sign --api-key=your-api-key --api-secret=your-api-secret
   ```

## Files Included
- `youtube_transcript_fetcher-1.0.0.zip` - Ready to install extension
- All source files for development

## Features
- Copy YouTube transcripts with one click
- Multiple summarization prompts
- Auto-redirect to ChatGPT or GitHub Copilot
- Auto-paste and submit functionality
- Multi-language support (EN/PT/ES)
