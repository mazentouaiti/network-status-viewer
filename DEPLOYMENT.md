# Network Status Viewer - Deployment Guide

## Quick Start

### Prerequisites

- Python 3.7 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Setup

#### Method 1: Using the Startup Scripts (Recommended)

**Windows PowerShell:**

```powershell
# Navigate to project directory
cd "C:\Users\touai\Projects\network status viewer"

# Run the startup script
.\start.ps1
```

**Windows Command Prompt:**

```cmd
# Navigate to project directory
cd "C:\Users\touai\Projects\network status viewer"

# Run the startup script
start.bat
```

#### Method 2: Manual Setup

**Step 1: Install Backend Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

**Step 2: Start Backend Server**

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Step 3: Open Frontend**

- Open `index.html` in your web browser
- Or serve it with a local server:

  ```bash
  # Using Python's built-in server
  python -m http.server 3000

  # Using Node.js serve
  npx serve .
  ```

## Usage

### File Upload

1. **Upload Network Files**: Drag & drop or click to browse for `.txt` or `.xml` files
2. **Supported Formats**:
   - Cisco Packet Tracer text exports (`.txt`)
   - Cisco Packet Tracer XML exports (`.xml`)

### Features

- 📊 **Interactive Network Visualization**: View your network topology as an interactive graph
- 📋 **Device Management**: Search, filter, and export device information
- 🔗 **Connection Analysis**: View and analyze network connections
- 🌓 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 💾 **Data Export**: Export device and connection data as CSV files

### Sample Data

- Click "Load Sample Data" to see the application in action
- Use the provided sample files in the `sample_files/` directory

## API Documentation

The backend provides a REST API with the following endpoints:

### GET /

- **Description**: Health check endpoint
- **Response**: `{"message": "Network Status Viewer API is running"}`

### POST /upload

- **Description**: Upload and parse network file
- **Parameters**:
  - `file`: FormData with the network file (.txt or .xml)
- **Response**:
  ```json
  {
    "devices": [{ "name": "Router0", "type": "Router", "ip": "192.168.1.1" }],
    "links": [{ "from": "Router0", "to": "Switch0" }],
    "metadata": {
      "filename": "network.txt",
      "file_type": ".txt",
      "devices_count": 5,
      "links_count": 4
    }
  }
  ```

## Troubleshooting

### Common Issues

**1. Backend Server Not Starting**

- Ensure Python 3.7+ is installed
- Check if port 8000 is available
- Verify all dependencies are installed: `pip install -r requirements.txt`

**2. CORS Errors**

- Make sure the backend server is running on `http://127.0.0.1:8000`
- Check that the frontend is accessing the correct API URL

**3. File Upload Issues**

- Ensure files are in `.txt` or `.xml` format
- Check file encoding (should be UTF-8)
- Verify file contains valid network configuration data

**4. Visualization Not Loading**

- Check browser console for JavaScript errors
- Ensure internet connection for CDN resources
- Try refreshing the page

### Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Development

### Project Structure

```
network-status-viewer/
├── backend/
│   ├── main.py              # FastAPI server
│   └── requirements.txt     # Python dependencies
├── sample_files/
│   ├── network_config.txt   # Sample text file
│   └── network_topology.xml # Sample XML file
├── index.html              # Frontend HTML
├── script.js              # Frontend JavaScript
├── manifest.json          # Web app manifest
├── start.ps1             # PowerShell startup script
├── start.bat             # Batch startup script
└── README.md             # Documentation
```

### Adding New Features

1. **Backend**: Modify `backend/main.py` to add new API endpoints
2. **Frontend**: Update `script.js` for new functionality and `index.html` for UI changes
3. **Styling**: Add custom CSS in the `<style>` section of `index.html`

### Customization

- **Colors**: Modify the CSS custom properties in the style section
- **Layout**: Adjust Tailwind CSS classes in the HTML
- **Network Visualization**: Customize Cytoscape.js styles and layouts in `script.js`

## Deployment Options

### Local Development

- Use the provided startup scripts for local testing and development

### Web Server Deployment

1. **Static Files**: Deploy `index.html`, `script.js`, and `manifest.json` to any web server
2. **Backend**: Deploy the FastAPI server using:
   - **Heroku**: Use the provided `requirements.txt`
   - **Docker**: Create a Dockerfile for the backend
   - **VPS**: Run with gunicorn: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker`

### Cloud Deployment

- **Frontend**: Deploy to Netlify, Vercel, or GitHub Pages
- **Backend**: Deploy to Railway, Render, or AWS Lambda

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please check the troubleshooting section above or create an issue in the project repository.
