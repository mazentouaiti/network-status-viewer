# 🌐 Network Status Viewer Pro

Advanced network topology analyzer with sidebar navigation, supporting Cisco Packet Tracer files with automatic PKT conversion and comprehensive analytics dashboard.

## 📋 Quick Start for Clients

**🎯 New User?** See the [**CLIENT_SETUP_GUIDE.md**](CLIENT_SETUP_GUIDE.md) for complete step-by-step instructions!

### Lightning Quick Setup (3 steps):

1. **Download** and extract the project files
2. **Install Python** (if not already installed) from [python.org](https://python.org)
3. **Double-click** `start.bat` to launch the application

That's it! Your browser will open the network analyzer automatically.

## ✨ What's New - Sidebar Layout

After uploading your network files, navigate through **5 organized tabs**:

- 📊 **Overview** - Network stats and health summary
- 🌐 **Network Topology** - Interactive graph visualization
- 🖥️ **Devices** - Detailed device table with search/export
- 🔗 **Connections** - Complete connection analysis
- 📈 **Analytics** - Network health metrics and insights

## 🚀 Features

### 🔧 **Universal File Support**

- **Direct .pkt upload** with automatic conversion
- **.txt and .xml** Cisco Packet Tracer exports
- **Drag & drop** file upload interface

### 📊 **Modern Sidebar Interface**

- **Organized navigation** with 5 dedicated tabs
- **Real-time counters** showing device and connection counts
- **Smooth transitions** between different views

### 🎯 **Advanced Analytics**

- **Network health scoring** with connectivity analysis
- **Device distribution charts** with visual breakdowns
- **Smart insights** with automated recommendations
- **Network density calculations** and diversity metrics

### 📋 **Data Management**

- **Search and filter** devices and connections
- **CSV export** for external analysis
- **Interactive highlighting** of devices in network graph
- **Device details** with comprehensive information

### 🌐 **Interactive Visualization**

- **Cytoscape.js** powered network graphs
- **Multiple layout algorithms** (Cola, Grid)
- **Zoom, pan, and fit** controls
- **Color-coded device types** with legend
- **Fullscreen mode** for detailed analysis

## 📁 Documentation

- 📖 [**CLIENT_SETUP_GUIDE.md**](CLIENT_SETUP_GUIDE.md) - Complete setup guide for end users
- 🔧 [**PKT_CONVERSION_GUIDE.md**](PKT_CONVERSION_GUIDE.md) - Advanced PKT conversion details
- 📄 [**PKT_EXPORT_GUIDE.md**](PKT_EXPORT_GUIDE.md) - How to export from Cisco Packet Tracer
- 🚀 [**DEPLOYMENT.md**](DEPLOYMENT.md) - Server deployment instructions

## 💻 Tech Stack

### Frontend

- **HTML5** + **Tailwind CSS** for modern UI
- **Vanilla JavaScript** for performance
- **Cytoscape.js** for interactive network visualization

### Backend

- **Python FastAPI** for API server
- **PTExplorer** for PKT file conversion
- **Universal parser** supporting multiple file formats

## 🔧 Development Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

Open `index.html` in a web browser or serve with a local server.

## 📊 API Endpoints

- `POST /upload` - Upload and parse network files (.pkt, .txt, .xml)
- `POST /convert` - Convert PKT files to XML format
- `GET /` - Health check and API status

## 🔒 Security & Privacy

- ✅ **Local processing** - All files processed on your machine
- ✅ **No external data transfer** - Complete privacy protection
- ✅ **Temporary file cleanup** - Automatic cleanup after processing
- ✅ **No code execution** - Safe read-only file parsing

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
