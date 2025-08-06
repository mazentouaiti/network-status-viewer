# Network Status Viewer

A full-stack web application for parsing and visualizing network topologies from Cisco Packet Tracer exports.

## Features

- 📁 **File Support**: Upload `.txt`, `.xml`, or `.pkt` files from Cisco Packet Tracer
- 🔍 **Smart PKT Handling**: Automatic detection with export guidance for binary PKT files
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

### With Export Guidance

- 📦 **`.pkt`** - Binary PKT files (provides step-by-step export instructions)

> **Note**: PKT files are binary format and cannot be directly parsed. The application will guide you through exporting them as `.txt` or `.xml` files in Cisco Packet Tracer.

## Tech Stack

### Frontend

- HTML5 + Tailwind CSS
- Vanilla JavaScript
- Cytoscape.js for network visualization

### Backend

- Python FastAPI
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
