# Network Status Viewer

A full-stack web application for parsing and visualizing network topologies from Cisco Packet Tracer exports.

## Features

- 📁 **File Support**: Upload `.txt`, `.xml`, or `.pkt` files from Cisco Packet Tracer
- � **PKT Conversion**: Automatic conversion of PKT files using PTExplorer technology
- 📊 **Network Visualization**: Interactive topology graphs with device highlighting
- 📋 **Device Management**: Search, filter, and export device information
- 🔗 **Connection Analysis**: View and analyze network connections
- 🌓 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 💾 **Data Export**: Export device and connection data as CSV files
- 🎯 **Interactive Controls**: Zoom, center, re-layout, and fullscreen view

## File Format Support

### Directly Supported

- ✅ **`.txt`** - Text exports from Cisco Packet Tracer
- ✅ **`.xml`** - XML exports from Cisco Packet Tracer
- ✅ **`.pkt`** - Binary PKT files (automatic conversion with PTExplorer)

### PKT Conversion Features

- 🔧 **Automatic Conversion**: PKT files are automatically converted to XML format
- 🔄 **Multiple Methods**: Uses PTExplorer, ZIP extraction, and binary parsing
- 📋 **Fallback Support**: Graceful handling when conversion tools aren't available
- 📖 **Detailed Guidance**: Step-by-step instructions for manual export if needed

> **New**: PKT files now support automatic conversion! Upload them directly and the system will convert them to a readable format using PTExplorer-based technology.

## Tech Stack

### Frontend

- HTML5 + Tailwind CSS
- Vanilla JavaScript
- Cytoscape.js for network visualization

### Backend

- Python FastAPI
- PTExplorer-based PKT conversion
- File upload and parsing
- JSON API responses

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

Open `index.html` in a web browser or serve with a local server.

## API Endpoints

- `POST /upload` - Upload and parse network files
- `GET /` - Health check

## File Format Support

- `.txt` - Text exports from Cisco Packet Tracer
- `.xml` - XML exports from Cisco Packet Tracer
