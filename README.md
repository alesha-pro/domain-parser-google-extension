# Domain Parser - Chrome DevTools Extension

A Chrome DevTools extension that captures and exports all domains with their IP addresses and network subnets from a website's network traffic.

## Features

- **Real-time monitoring** - Captures network requests as they happen
- **Domain extraction** - Parses unique domains from all HTTP/HTTPS requests
- **IP address resolution** - Automatically resolves IP addresses for all domains via DNS-over-HTTPS
- **Subnet calculation** - Calculates /24 network subnets with automatic /16 aggregation
- **Dual export options** - Separate exports for domains and IP subnets
- **VPN-independent** - Uses Google DNS API to get real IP addresses, bypassing VPN/proxy interference
- **Clean UI** - Modern dark theme with real-time statistics and progress indicators
- **Privacy focused** - No data collection, everything stays local

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store page](https://chromewebstore.google.com/detail/domain-parser/gmnjnlccjbbmcehcobmjdlkliicahcdl)
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
3. Navigate to the **\"Domain Parser\"** tab
4. Click **\"Start Recording\"** to begin capturing domains
5. Interact with the website or refresh the page
6. Click **\"Stop Recording\"** (DNS resolution happens automatically)
7. Choose your export:
   - **\"Export Domains\"** - Download plain domain list
   - **\"Export IPs\"** - Download IP addresses with network subnets

### Example Output

**Domains export** (`domains-2026-01-23T12-30-45.txt`):
```
cdn.cloudflare.com
fonts.googleapis.com
www.google-analytics.com
```

**IP Subnets export** (`ip-subnets-2026-01-23T12-30-45.txt`):
```
// cdn.cloudflare.com
104.16.0.0/16
172.64.0.0/16

// fonts.googleapis.com
142.250.0.0/16

// www.google-analytics.com
142.250.150.0/24
```

## Use Cases

- **Security audits** - Discover all third-party services and their IP ranges a website uses
- **Network analysis** - Map out infrastructure and CDN providers by IP subnets
- **Privacy analysis** - See which trackers and analytics are loaded with their network locations
- **Development** - Debug API endpoints, CDN usage, and network architecture
- **Compliance** - Document external data processors and their networks for GDPR/security reviews
- **Firewall configuration** - Generate subnet lists for allowlist/blocklist rules

## How It Works

1. **Domain Collection** - Monitors Chrome DevTools Network panel and extracts domains from all HTTP/HTTPS requests
2. **DNS Resolution** - Uses Google DNS-over-HTTPS API to resolve real IP addresses (bypasses VPN/proxy)
3. **Subnet Calculation** - Converts IPs to /24 CIDR subnets
4. **Smart Aggregation** - Automatically merges 4+ adjacent /24 subnets into /16 blocks
5. **Export** - Generates formatted text files for domains and IP subnets

## Technical Details

- **DNS Provider**: Google DNS-over-HTTPS API (`dns.google`)
- **Subnet Mask**: /24 by default (e.g., `192.168.1.0/24`)
- **Auto-aggregation**: 4+ subnets in same /16 block → merged to /16
- **Batch Processing**: DNS queries in batches of 10 for optimal performance
- **Caching**: DNS results cached to avoid duplicate queries

## Privacy

This extension:
- Does NOT collect any user data
- Does NOT send data to external servers (except DNS queries to dns.google for IP resolution)
- Does NOT store data persistently
- All processing happens locally in your browser

See [PRIVACY.md](PRIVACY.md) for full privacy policy.

## License

MIT License
