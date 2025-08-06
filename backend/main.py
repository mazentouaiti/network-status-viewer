from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import xml.etree.ElementTree as ET
import re
import json
from typing import Dict, List, Any
import os

app = FastAPI(title="Network Status Viewer API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NetworkParser:
    def __init__(self):
        self.devices = []
        self.links = []
    
    def parse_txt_file(self, content: str) -> Dict[str, Any]:
        """Parse text file content from Cisco Packet Tracer"""
        self.devices = []
        self.links = []
        
        lines = content.split('\n')
        current_device = None
        
        # Common patterns for Cisco Packet Tracer text exports
        device_pattern = re.compile(r'^(Router|Switch|PC|Server|Hub|Bridge)\s*(\d+|[A-Za-z0-9-_]+)', re.IGNORECASE)
        ip_pattern = re.compile(r'(\d+\.\d+\.\d+\.\d+)')
        interface_pattern = re.compile(r'(FastEthernet|GigabitEthernet|Serial|Ethernet)\s*(\d+/\d+|\d+)', re.IGNORECASE)
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check for device declaration
            device_match = device_pattern.match(line)
            if device_match:
                device_type = device_match.group(1)
                device_name = f"{device_type}{device_match.group(2)}"
                current_device = {
                    "name": device_name,
                    "type": device_type,
                    "ip": ""
                }
                continue
            
            # Look for IP addresses
            if current_device:
                ip_match = ip_pattern.search(line)
                if ip_match and not current_device["ip"]:
                    current_device["ip"] = ip_match.group(1)
                    self.devices.append(current_device.copy())
                    current_device = None
            
            # Look for connections (simple heuristic)
            if "connected to" in line.lower() or "link" in line.lower():
                parts = line.split()
                if len(parts) >= 3:
                    # Try to extract device names from connection description
                    for i, part in enumerate(parts):
                        if device_pattern.match(part) and i + 1 < len(parts):
                            device1 = part
                            remaining = " ".join(parts[i+1:])
                            device2_match = device_pattern.search(remaining)
                            if device2_match:
                                device2 = device2_match.group(0)
                                self.links.append({"from": device1, "to": device2})
        
        # If no devices found, create sample data based on IP addresses found
        if not self.devices:
            ips = ip_pattern.findall(content)
            for i, ip in enumerate(set(ips)):
                device_type = "PC" if ip.endswith(('.10', '.11', '.12', '.20', '.21', '.22')) else "Router"
                self.devices.append({
                    "name": f"{device_type}{i}",
                    "type": device_type,
                    "ip": ip
                })
        
        return {"devices": self.devices, "links": self.links}
    
    def parse_xml_file(self, content: str) -> Dict[str, Any]:
        """Parse XML file content from Cisco Packet Tracer"""
        self.devices = []
        self.links = []
        
        try:
            root = ET.fromstring(content)
            
            # Parse devices
            for device in root.findall('.//device') or root.findall('.//Device'):
                name = device.get('name') or device.get('Name') or device.find('name') or device.find('Name')
                device_type = device.get('type') or device.get('Type') or device.find('type') or device.find('Type')
                
                if isinstance(name, ET.Element):
                    name = name.text
                if isinstance(device_type, ET.Element):
                    device_type = device_type.text
                
                # Find IP address
                ip = ""
                ip_elem = device.find('.//ip') or device.find('.//IP') or device.find('.//ipAddress')
                if ip_elem is not None:
                    ip = ip_elem.text or ip_elem.get('address', '')
                
                if name and device_type:
                    self.devices.append({
                        "name": name,
                        "type": device_type,
                        "ip": ip or ""
                    })
            
            # Parse links/connections
            for link in root.findall('.//link') or root.findall('.//Link') or root.findall('.//connection'):
                source = link.get('source') or link.get('Source') or link.get('from')
                target = link.get('target') or link.get('Target') or link.get('to')
                
                if not source:
                    source_elem = link.find('source') or link.find('Source') or link.find('from')
                    if source_elem is not None:
                        source = source_elem.text
                
                if not target:
                    target_elem = link.find('target') or link.find('Target') or link.find('to')
                    if target_elem is not None:
                        target = target_elem.text
                
                if source and target:
                    self.links.append({"from": source, "to": target})
            
            # If no specific structure found, try to extract any network-related info
            if not self.devices:
                # Look for any elements that might contain device info
                for elem in root.iter():
                    if elem.tag.lower() in ['router', 'switch', 'pc', 'server', 'host']:
                        name = elem.get('name') or elem.get('id') or f"{elem.tag}_{len(self.devices)}"
                        ip = elem.get('ip') or elem.get('address') or ""
                        self.devices.append({
                            "name": name,
                            "type": elem.tag.title(),
                            "ip": ip
                        })
            
        except ET.ParseError as e:
            # If XML parsing fails, try to extract some basic info
            ip_pattern = re.compile(r'(\d+\.\d+\.\d+\.\d+)')
            ips = ip_pattern.findall(content)
            for i, ip in enumerate(set(ips)):
                self.devices.append({
                    "name": f"Device{i}",
                    "type": "Unknown",
                    "ip": ip
                })
        
        return {"devices": self.devices, "links": self.links}

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Network Status Viewer API is running"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and parse network file"""
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    # Handle .pkt files with helpful error message
    if file_extension == '.pkt':
        raise HTTPException(
            status_code=400,
            detail={
                "error": "PKT files are not directly supported",
                "message": "PKT files are binary format. Please export your network from Cisco Packet Tracer:",
                "instructions": [
                    "1. Open your .pkt file in Cisco Packet Tracer",
                    "2. Go to File → Export → Export as Text (for .txt export)",
                    "3. Or use File → Export → Export as XML (for .xml export)",
                    "4. Upload the exported .txt or .xml file instead"
                ],
                "supported_formats": [".txt", ".xml"]
            }
        )
    
    if file_extension not in ['.txt', '.xml']:
        raise HTTPException(
            status_code=400, 
            detail={
                "error": "Unsupported file format",
                "message": f"File type '{file_extension}' is not supported",
                "supported_formats": [".txt", ".xml"],
                "note": "For .pkt files, please export them as .txt or .xml from Cisco Packet Tracer first"
            }
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Check if file might be binary (basic detection)
        try:
            content_str = content.decode('utf-8')
        except UnicodeDecodeError:
            # Try with different encodings
            for encoding in ['latin1', 'cp1252', 'iso-8859-1']:
                try:
                    content_str = content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "File encoding not supported",
                        "message": "This appears to be a binary file or uses an unsupported encoding",
                        "suggestion": "If this is a .pkt file, please export it as .txt or .xml from Cisco Packet Tracer"
                    }
                )
        
        # Check for binary content patterns that might indicate a .pkt file
        if len(content_str) > 100 and (
            content_str.count('\x00') > len(content_str) * 0.1 or  # Too many null bytes
            any(ord(c) > 127 for c in content_str[:100])  # Non-ASCII characters at start
        ):
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Binary file detected",
                    "message": "This appears to be a binary file (possibly a .pkt file)",
                    "instructions": [
                        "If this is a Cisco Packet Tracer .pkt file:",
                        "1. Open the file in Cisco Packet Tracer",
                        "2. Export as Text (.txt) or XML (.xml)",
                        "3. Upload the exported file instead"
                    ]
                }
            )
        
        # Parse based on file type
        parser = NetworkParser()
        if file_extension == '.xml':
            result = parser.parse_xml_file(content_str)
        else:
            result = parser.parse_txt_file(content_str)
        
        # Add metadata
        result["metadata"] = {
            "filename": file.filename,
            "file_type": file_extension,
            "devices_count": len(result["devices"]),
            "links_count": len(result["links"]),
            "file_size": len(content)
        }
        
        return JSONResponse(content=result)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing file: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
