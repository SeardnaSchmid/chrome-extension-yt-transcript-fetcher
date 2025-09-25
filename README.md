# YouTube Transcript Fetcher - Firefox Extension

A Firefox extension that allows users to easily copy YouTube video transcripts with one click, featuring multi-language support, customizable prompts, and intelligent text splitting for AI models.

## Features

- 🎯 **One-Click Copy**: Simple button integration in YouTube's interface
- 🌍 **Multi-Language Support**: English, Portuguese, and Spanish interface
- 🤖 **AI-Ready**: Smart text splitting for ChatGPT, GPT-4, and custom limits
- 📝 **Customizable Prompts**: Built-in summary prompts in multiple languages
- ⏰ **Timestamp Control**: Option to include/exclude timestamps
- 🔄 **Auto-Split**: Intelligent text splitting for large transcripts
- 🎨 **Native Integration**: Seamless integration with YouTube's UI

## Installation

### For Development

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from the extension directory

### For Production

*Note: This extension is not yet published on Mozilla Add-ons. Follow the development installation steps above.*

## Usage

1. Navigate to any YouTube video page
2. Wait for the transcript copy button to appear (🗎 icon) next to other video actions
3. Click the button to copy the transcript
4. Configure options via the extension popup:
   - **Interface Language**: Choose your preferred interface language
   - **Prompt Language**: Set the language for AI prompts
   - **Prompt Type**: Select from various summary templates
   - **Split Options**: Enable auto-splitting for AI models
   - **Character Limits**: Choose predefined limits or set custom limits

## Features in Detail

### Multi-Language Interface
- **English**: Full interface and prompts
- **Portuguese**: Complete translation including prompts
- **Spanish**: Complete translation including prompts

### Prompt Types
- **No Prompt**: Copy transcript as-is
- **General Summary**: Basic summarization prompt
- **Detailed Analysis**: In-depth analysis prompt
- **Bullet Points**: Structured bullet-point summary
- **Section Summary**: Divide content into sections

### Smart Text Splitting
- **GPT-4**: 400,000 character limit
- **GPT-3.5**: 13,000 character limit
- **Custom**: Set your own character limit
- **Progressive Copying**: Copy large transcripts in manageable chunks

### Transcript Processing
- **Timestamp Control**: Include or exclude timestamps
- **Language Detection**: Works with transcripts in multiple languages
- **Error Handling**: Graceful fallback when transcripts aren't available

## Technical Details

### Browser Compatibility
- Firefox 57.0+
- Uses Manifest V2 for Firefox compatibility
- Cross-browser API compatibility layer

### Permissions
- `clipboardWrite`: Copy text to clipboard
- `storage`: Save user preferences
- `https://www.youtube.com/*`: Access YouTube pages

### Architecture
- **Content Script**: Integrates with YouTube's interface
- **Popup Interface**: Settings and configuration
- **Storage System**: Persistent user preferences
- **Notification System**: User feedback and progress tracking

## Development

### Project Structure
```
firefox-extension-yt-transcript-fetcher/
├── manifest.json          # Extension manifest
├── content.js            # Main content script
├── popup.html           # Settings popup interface
├── popup.js             # Popup functionality
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

### Key Functions
- `addCopyButton()`: Adds the copy button to YouTube's interface
- `isTranscriptionAvailable()`: Detects if transcripts are available
- `splitText()`: Intelligently splits large texts
- `createNotificationSystem()`: Provides user feedback

### Browser API Usage
- `browser.storage.sync`: Cross-browser storage API
- `navigator.clipboard`: Modern clipboard API
- `MutationObserver`: Monitors YouTube's dynamic content

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## Known Issues

- Transcript availability depends on YouTube's built-in transcription
- Some videos may not have transcripts available
- Large transcripts may take a moment to process

## Future Enhancements

- [ ] Support for more languages
- [ ] Custom prompt templates
- [ ] Export to various formats (PDF, TXT, etc.)
- [ ] Integration with more AI services
- [ ] Keyboard shortcuts
- [ ] Dark mode interface

## License

This project is open source. Please ensure compliance with YouTube's Terms of Service when using this extension.

## Changelog

### Version 1.0.0
- Initial release
- Multi-language support (EN, PT, ES)
- Smart text splitting
- Customizable prompts
- Firefox compatibility

## Support

If you encounter any issues or have suggestions, please:
1. Check the browser console for error messages
2. Verify that transcripts are available for the video
3. Try refreshing the page
4. Check the extension settings

For debugging, you can access `window.debugYouTubeTranscriptFetcher()` in the browser console on YouTube pages.
# chrome-extension-yt-transcript-fetcher
