# Firefox Extension Development

## Quick Start Guide

1. **Install web-ext** (optional but recommended):
   ```bash
   npm install
   ```

2. **Load the extension in Firefox**:
   - Open Firefox
   - Go to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from this directory

3. **Test the extension**:
   - Navigate to a YouTube video
   - Look for the copy transcript button (📋 icon)
   - Click to copy the transcript

## Development Commands

```bash
# Run extension in development mode
npm start

# Build extension package
npm run package

# Lint extension code
npm run lint
```

## File Structure

- `manifest.json` - Extension manifest (Firefox format)
- `content.js` - Main content script for YouTube integration
- `popup.html` - Settings popup interface
- `popup.js` - Popup functionality and settings management
- `icons/` - Extension icons in multiple sizes
- `README.md` - Documentation
- `package.json` - Development dependencies and scripts

## Testing

Test the extension on various YouTube videos:
- Videos with auto-generated transcripts
- Videos with manual transcripts
- Videos in different languages
- Long videos (>1 hour) to test splitting functionality

## Distribution

To package for distribution:
1. Run `npm run package`
2. The packaged extension will be in the `dist/` directory
3. Submit to Mozilla Add-ons for review
