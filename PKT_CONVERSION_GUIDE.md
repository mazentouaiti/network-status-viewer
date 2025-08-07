# PKT File Conversion Guide

## Overview

The Network Status Viewer now supports direct upload and automatic conversion of Cisco Packet Tracer `.pkt` files using PTExplorer-based conversion technology.

## Features

### 🔧 **Automatic PKT Conversion**

- Upload `.pkt` files directly to the application
- Automatic conversion to XML format for parsing
- Multiple conversion methods for maximum compatibility
- Fallback conversion if PTExplorer is unavailable

### 📁 **Supported File Formats**

- ✅ `.txt` - Cisco Packet Tracer text exports
- ✅ `.xml` - Cisco Packet Tracer XML exports
- ✅ `.pkt` - Cisco Packet Tracer binary files (with automatic conversion)

## How It Works

### Conversion Process

1. **Upload Detection**: When you upload a `.pkt` file, the system automatically detects the format
2. **Conversion Attempt**: Multiple conversion methods are tried in order:
   - PTExplorer tool (if available)
   - ZIP extraction (PKT files sometimes contain XML/JSON)
   - Binary parsing (extract readable strings and device info)
3. **XML Generation**: Converted data is structured into XML format
4. **Network Parsing**: XML data is parsed to extract devices and connections
5. **Visualization**: Network topology is displayed with interactive features

### Conversion Methods

#### Method 1: PTExplorer Tool

```python
# Uses PTExplorer open-source tool
subprocess.run(["pka2xml", "-d", input_path, output_path])
```

#### Method 2: ZIP Extraction

```python
# PKT files are sometimes ZIP archives
with zipfile.ZipFile(pkt_file_path, 'r') as zip_ref:
    # Extract XML/JSON files from archive
```

#### Method 3: Binary Parsing

```python
# Extract ASCII strings and device patterns
ascii_strings = re.findall(b'[A-Za-z0-9._-]{3,20}', content)
```

## Installation

### Automatic Setup

Run the start script which includes PKT converter setup:

```batch
start.bat
```

### Manual Installation

If you need to install PKT conversion support manually:

```bash
cd backend
python install_pkt_converter.py
```

### Dependencies

The following packages are automatically installed:

- `requests` - For downloading PKT tools
- `xmltodict` - For XML processing
- `python-magic` - For file type detection
- `python-magic-bin` - Windows binary support

## API Endpoints

### Upload with Conversion

```http
POST /upload
Content-Type: multipart/form-data

{
  "file": "network.pkt"
}
```

**Response:**

```json
{
  "devices": [...],
  "links": [...],
  "metadata": {
    "filename": "network.pkt",
    "original_file_type": ".pkt",
    "processed_as": ".xml",
    "pkt_converted": true,
    "devices_count": 5,
    "links_count": 4
  }
}
```

### Direct PKT Conversion

```http
POST /convert
Content-Type: multipart/form-data

{
  "file": "network.pkt"
}
```

**Response:**

```json
{
  "success": true,
  "xml": "<?xml version='1.0'?>...",
  "message": "PKT file successfully converted to XML",
  "conversion_method": "PTExplorer-based conversion"
}
```

## Troubleshooting

### Common Issues

#### PKT Conversion Failed

If automatic conversion fails, you'll see:

```
PKT conversion failed. Please try one of these alternatives:
1. Open your .pkt file in Cisco Packet Tracer
2. Go to File → Export → Export as Text (for .txt export)
3. Or use File → Export → Export as XML (for .xml export)
4. Upload the exported .txt or .xml file instead
```

**Solutions:**

1. **Manual Export**: Use Cisco Packet Tracer to export manually
2. **Update PKT Tools**: Run `python install_pkt_converter.py` again
3. **Check File Integrity**: Ensure the PKT file isn't corrupted

#### PTExplorer Not Available

If PTExplorer installation fails, the system uses fallback conversion:

```python
# Fallback: Extract readable strings from binary data
def simple_pkt_to_xml(pkt_path):
    # Basic string extraction and XML generation
```

#### Encoding Issues

For files with special characters:

- UTF-8 (default)
- Latin-1 fallback
- CP1252 fallback
- ISO-8859-1 fallback

## Supported PKT File Versions

### Tested Versions

- ✅ Cisco Packet Tracer 8.x
- ✅ Cisco Packet Tracer 7.x
- ⚠️ Older versions (may require manual export)

### File Size Limits

- Maximum file size: 50MB
- Recommended: Under 10MB for optimal performance

## Security Notes

### File Processing Safety

- PKT files are processed in isolated temporary directories
- Temporary files are automatically cleaned up
- No execution of embedded scripts or code
- Read-only parsing of network topology data

### Data Privacy

- Files are processed locally on your machine
- No data is sent to external services
- Temporary files are immediately deleted after processing

## Advanced Usage

### Custom Conversion Scripts

You can extend the converter by modifying `pkt_converter.py`:

```python
class CustomPKTConverter(PKTConverter):
    def custom_parsing_method(self, pkt_file_path):
        # Your custom PKT parsing logic
        pass
```

### Integration with Other Tools

The conversion API can be used independently:

```python
from pkt_converter import PKTConverter

converter = PKTConverter()
xml_content = converter.convert_pkt_to_xml("network.pkt")
```

## Contributing

### Adding New Conversion Methods

1. Fork the repository
2. Add your conversion method to `PKTConverter` class
3. Update the method priority in `convert_pkt_to_xml()`
4. Submit a pull request

### Testing PKT Files

Help improve conversion by testing with various PKT files:

- Different Packet Tracer versions
- Various network topologies
- Different device types and configurations

## License

This PKT conversion feature is based on the open-source PTExplorer project and follows the same licensing terms for maximum compatibility with the Cisco Packet Tracer ecosystem.
