# Domain Parser - Chrome DevTools Extension

A Chrome DevTools extension that captures and exports all domains a website connects to.

## Features

- **Real-time monitoring** - Captures network requests as they happen
- **Domain extraction** - Parses unique domains from all HTTP/HTTPS requests  
- **One-click export** - Download all domains as a TXT file
- **Clean UI** - Modern dark theme that matches Chrome DevTools
- **Privacy focused** - No data collection, everything stays local

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store page](#)
2. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder

## Usage

1. Open any website
2. Open Chrome DevTools (`F12` or `Cmd+Option+I`)
3. Navigate to the **"Domain Parser"** tab
4. Click **"Start Recording"** to begin capturing domains
5. Interact with the website or refresh the page
6. Click **"Export to TXT"** to download the domain list

## Use Cases

- **Security audits** - Discover all third-party services a website uses
- **Privacy analysis** - See which trackers and analytics are loaded
- **Development** - Debug API endpoints and CDN usage
- **Compliance** - Document external data processors for GDPR

## Privacy

This extension:
- Does NOT collect any user data
- Does NOT send data to external servers
- Does NOT store data persistently
- Works entirely offline

See [PRIVACY.md](PRIVACY.md) for full privacy policy.

## License

MIT License
