# 🌐 Network Topology Analyzer - Client Setup Guide

## Welcome to Network Status Viewer Pro!

This powerful tool allows you to visualize and analyze your Cisco Packet Tracer network topologies with an intuitive sidebar interface and comprehensive analytics dashboard.

---

## 📋 Quick Overview

**What This Tool Does:**

- 📊 **Visualize Network Topologies** - Interactive network graphs with device highlighting
- 🔍 **Analyze Network Health** - Comprehensive analytics and insights
- 📋 **Export Data** - Device and connection tables with CSV export
- 🔄 **Multiple File Formats** - Supports .pkt, .txt, and .xml files from Cisco Packet Tracer
- 🎯 **Easy Navigation** - Modern sidebar interface with organized tabs

---

## 🚀 Getting Started (3 Easy Steps!)

### Step 1: Download & Extract

1. Download the project files to your PC
2. Extract to a folder like `C:\NetworkAnalyzer\`
3. You should see these files:
   ```
   NetworkAnalyzer/
   ├── index.html          (Main application)
   ├── script.js           (Application logic)
   ├── backend/            (Server files)
   ├── start.bat           (Windows launcher)
   └── README files
   ```

### Step 2: Install Python (if not already installed)

1. **Download Python**: Go to [python.org](https://python.org) and download Python 3.8 or newer
2. **Important**: During installation, check "Add Python to PATH" ✅
3. **Verify Installation**: Open Command Prompt and type:
   ```cmd
   python --version
   ```
   You should see something like `Python 3.11.x`

### Step 3: Launch the Application

1. **Double-click** `start.bat` in your project folder
2. Wait for the setup to complete (first time takes 1-2 minutes)
3. Your browser will automatically open the application
4. You're ready to analyze networks! 🎉

---

## 💻 Using the Network Analyzer

### Upload Your Network Files

1. **Drag & Drop** or **Click to Browse** your network files
2. **Supported formats**:
   - 📄 `.pkt` - Cisco Packet Tracer files (automatically converted)
   - 📄 `.txt` - Packet Tracer text exports
   - 📄 `.xml` - Packet Tracer XML exports

### Navigate Through Tabs

After uploading, use the **sidebar navigation** to explore different views:

#### 📊 **Overview Tab**

- Network statistics and health metrics
- Quick insights about your topology
- Device count and connection summary

#### 🌐 **Network Topology Tab**

- Interactive network visualization
- Click and drag devices to reorganize
- Use controls: Fit View, Center, Re-layout, Fullscreen
- Color-coded device types (Router, Switch, PC, Server, etc.)

#### 🖥️ **Devices Tab**

- Detailed table of all network devices
- Search and filter devices
- Export device list to CSV
- Highlight devices in the network graph

#### 🔗 **Connections Tab**

- Complete list of network connections
- Search and filter connections
- Export connection data to CSV
- View connection types and status

#### 📈 **Analytics Tab**

- Network health analysis
- Connectivity scores and metrics
- Device distribution charts
- Network insights and recommendations

---

## 📁 How to Export Files from Cisco Packet Tracer

### Method 1: Direct .pkt Upload (Recommended)

- Simply upload your `.pkt` file directly
- The tool will automatically convert it for analysis

### Method 2: Manual Export (if automatic conversion fails)

#### For .txt Export:

1. Open your network in Cisco Packet Tracer
2. Go to **File** → **Export** → **Export as Text**
3. Save the file and upload it to the analyzer

#### For .xml Export:

1. Open your network in Cisco Packet Tracer
2. Go to **File** → **Export** → **Export as XML**
3. Save the file and upload it to the analyzer

---

## 🔧 Troubleshooting

### Application Won't Start

**Problem**: Double-clicking `start.bat` shows errors
**Solutions**:

1. **Check Python Installation**:
   ```cmd
   python --version
   pip --version
   ```
2. **Manual Setup**:
   ```cmd
   cd path\to\your\project\backend
   pip install -r requirements.txt
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
3. **Open browser manually**: Go to `http://127.0.0.1:8000` or open `index.html`

### File Upload Issues

**Problem**: "Error processing file" message
**Solutions**:

1. **Check file format**: Ensure it's .pkt, .txt, or .xml
2. **File size**: Keep files under 50MB (recommended under 10MB)
3. **Manual export**: Use Cisco Packet Tracer to export manually
4. **Check network**: Ensure the backend server is running

### Browser Compatibility

**Recommended browsers**:

- ✅ Chrome (best performance)
- ✅ Firefox
- ✅ Edge
- ⚠️ Safari (limited testing)

### Network Visualization Issues

**Problem**: Graph doesn't display properly
**Solutions**:

1. **Refresh the page**
2. **Click "Fit View"** button in topology tab
3. **Try different layout** using "Re-layout" button
4. **Check browser console** for JavaScript errors

---

## 📊 Understanding Your Network Analysis

### Network Health Score

- **Green (80-100%)**: Excellent connectivity
- **Yellow (60-79%)**: Good with room for improvement
- **Red (0-59%)**: Poor connectivity, may have isolated devices

### Device Types & Colors

- 🔴 **Router** (Red) - Network routing devices
- 🔵 **Switch** (Blue) - Network switching devices
- 🟢 **PC** (Green) - End user devices
- 🟣 **Server** (Purple) - Server devices
- ⚫ **Other** (Gray) - Miscellaneous devices

### Analytics Insights

- **Connectivity Score**: Measures how well devices are connected
- **Device Diversity**: Number of different device types
- **Network Density**: Ratio of actual to possible connections
- **Insights**: Automated recommendations for network improvement

---

## 💡 Tips for Best Results

### File Preparation

1. **Save your work** in Packet Tracer before exporting
2. **Use descriptive device names** for better visualization
3. **Keep networks under 100 devices** for optimal performance

### Analysis Tips

1. **Check the Overview tab first** for quick network summary
2. **Use search functions** to find specific devices quickly
3. **Export data to CSV** for further analysis in Excel
4. **Try different layout options** in topology view

### Performance Optimization

1. **Close other browser tabs** for better performance
2. **Use latest browser versions**
3. **For large networks**, consider breaking into smaller segments

---

## 🔒 Privacy & Security

### Your Data is Safe

- ✅ **All processing happens locally** on your computer
- ✅ **No data sent to external servers**
- ✅ **Files are automatically cleaned up** after processing
- ✅ **No installation of suspicious software**

### File Handling

- Temporary files are created only during processing
- Original files remain unchanged
- All temporary data is deleted after analysis

---

## 📞 Support & Help

### Common Issues & Solutions

| Issue             | Solution                                             |
| ----------------- | ---------------------------------------------------- |
| Python not found  | Install Python and add to PATH                       |
| Port 8000 in use  | Change port in start.bat or close other applications |
| File won't upload | Check file format and size                           |
| Graph not showing | Try different browser or refresh page                |
| Slow performance  | Close other applications, use smaller files          |

### Getting Help

1. **Check this guide first** - Most issues are covered here
2. **Look at error messages** - They usually explain the problem
3. **Try the troubleshooting steps** above
4. **Check the PKT_CONVERSION_GUIDE.md** for advanced PKT file issues

### File Examples

Sample network files are included in the `sample_files/` folder to test the application.

---

## 🎯 What's Next?

Once you're comfortable with the basic features:

1. **Explore advanced analytics** in the Analytics tab
2. **Try different network topologies** to see various insights
3. **Use the CSV export** feature for external analysis
4. **Experiment with the interactive graph** controls

---

## 📝 System Requirements

### Minimum Requirements

- **OS**: Windows 10 or later
- **Python**: 3.8 or newer
- **RAM**: 4GB minimum
- **Browser**: Chrome, Firefox, or Edge
- **Storage**: 1GB free space

### Recommended

- **OS**: Windows 11
- **Python**: 3.11 or newer
- **RAM**: 8GB or more
- **Browser**: Latest Chrome
- **Storage**: 2GB free space

---

**🎉 Congratulations!** You're now ready to analyze your network topologies like a pro!

_For technical details and advanced usage, see the other documentation files in this project._
