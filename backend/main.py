from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import xml.etree.ElementTree as ET
import re
import json
from typing import Dict, List, Any
import os
import tempfile
from pkt_converter import PKTConverter

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
        """Parse text file content from any network topology format"""
        self.devices = []
        self.links = []
        
        lines = content.split('\n')
        current_device = None
        
        # Comprehensive patterns for multiple formats
        # Format 1: Structured format (Device ID: xxx)
        device_id_pattern = re.compile(r'Device\s*(?:ID|Name):\s*(.+)', re.IGNORECASE)
        device_type_pattern = re.compile(r'(?:Device\s*)?Type:\s*(.+)', re.IGNORECASE)
        ip_address_pattern = re.compile(r'IP\s*(?:Address)?:\s*(\d+\.\d+\.\d+\.\d+)', re.IGNORECASE)
        connected_to_pattern = re.compile(r'Connected\s*(?:To|Device):\s*(.+)', re.IGNORECASE)
        
        # Format 6: Enterprise format (Router: R1, Switch: S1, PC: PC-Sales1)
        enterprise_device_pattern = re.compile(r'^(Router|Switch|PC|Server|Hub|Bridge|Host|Firewall|AP):\s*(.+)', re.IGNORECASE)
        connection_arrow_pattern = re.compile(r'([A-Za-z0-9\-_]+).*?<->.*?([A-Za-z0-9\-_]+)', re.IGNORECASE)
        
        # Format 2: Simple device declarations
        simple_device_pattern = re.compile(r'^(Router|Switch|PC|Server|Hub|Bridge|Host|Node|Device)\s*([A-Za-z0-9\-_]+)\s*(\d+\.\d+\.\d+\.\d+)?', re.IGNORECASE)
        
        # Format 3: Network notation (Router1 - Switch1)
        connection_dash_pattern = re.compile(r'^([A-Za-z0-9\-_]+)\s*[\-\–\—]\s*([A-Za-z0-9\-_\.]+)', re.IGNORECASE)
        
        # Format 4: Connection with "connects to" or similar
        connection_word_pattern = re.compile(r'^([A-Za-z0-9\-_]+)\s+(?:connects?\s+to|connected\s+to|links?\s+to|attached\s+to)\s+([A-Za-z0-9\-_]+)', re.IGNORECASE)
        
        # Format 5: Tabular format (device_name | type | ip)
        tabular_pattern = re.compile(r'^([A-Za-z0-9\-_]+)\s*[\|\t]\s*([A-Za-z]+)\s*[\|\t]?\s*(\d+\.\d+\.\d+\.\d+)?', re.IGNORECASE)
        
        # General patterns
        ip_pattern = re.compile(r'(\d+\.\d+\.\d+\.\d+)')
        device_name_pattern = re.compile(r'([A-Za-z][A-Za-z0-9\-_]*[0-9]+|[A-Za-z]+)', re.IGNORECASE)
        interface_pattern = re.compile(r'(FastEthernet|GigabitEthernet|Serial|Ethernet|Fa|Gi|Se|Et)\s*(\d+/\d+|\d+)', re.IGNORECASE)
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#') or line.startswith('//') or line.startswith(';'):
                continue
            
            # Skip sections that are not device definitions
            if any(skip_word in line.lower() for skip_word in [
                'routing table', 'mac address table', 'interfaces:', 'spanning tree', 'ospf enabled',
                '[routing table', '[protocols]', '[simulation summary]', 'ping test:', 'packet loss:'
            ]):
                continue
            
            # Skip section headers but continue processing
            if line.startswith('[') and line.endswith(']'):
                section = line.lower()
                if 'connections' in section:
                    # We're entering the connections section
                    pass
                continue
            
            # Try different parsing approaches in order of specificity
            
            # 1. Enterprise format (Router: R1, Switch: S1, PC: PC-Sales1) - HIGHEST PRIORITY
            enterprise_device_match = enterprise_device_pattern.match(line)
            if enterprise_device_match:
                # Save previous device if it exists
                if current_device and current_device["name"]:
                    self.devices.append(current_device.copy())
                
                device_type = enterprise_device_match.group(1).strip()
                device_name = enterprise_device_match.group(2).strip()
                
                current_device = {
                    "name": device_name,
                    "type": self._normalize_device_type(device_type),
                    "ip": ""
                }
                continue
            
            # 2. Structured format (Device ID: xxx)
            device_id_match = device_id_pattern.match(line)
            if device_id_match:
                # Save previous device if it exists
                if current_device and current_device["name"]:
                    self.devices.append(current_device.copy())
                
                current_device = {
                    "name": device_id_match.group(1).strip(),
                    "type": "Unknown",
                    "ip": ""
                }
                continue
            
            # Handle structured format attributes
            if current_device:
                device_type_match = device_type_pattern.match(line)
                if device_type_match:
                    device_type = device_type_match.group(1).strip()
                    current_device["type"] = self._normalize_device_type(device_type)
                    continue
                
                # Look for IP addresses in various formats
                ip_match = ip_address_pattern.match(line)
                if ip_match:
                    current_device["ip"] = ip_match.group(1)
                    continue
                
                # Look for IP in "IP: x.x.x.x/xx" format
                ip_cidr_match = re.search(r'IP:\s*(\d+\.\d+\.\d+\.\d+)', line, re.IGNORECASE)
                if ip_cidr_match:
                    current_device["ip"] = ip_cidr_match.group(1)
                    continue
                
                # Look for IP addresses anywhere in the line when in device context
                ip_anywhere = re.search(r'(\d+\.\d+\.\d+\.\d+)', line)
                if ip_anywhere and not current_device["ip"]:
                    # Make sure it's not a network address or subnet mask
                    potential_ip = ip_anywhere.group(1)
                    # Skip common network addresses and invalid IPs
                    if not (potential_ip.endswith('.0') or potential_ip.endswith('.255') or 
                           potential_ip.startswith('255.') or potential_ip == '0.0.0.0'):
                        current_device["ip"] = potential_ip
                        continue
                
                connected_match = connected_to_pattern.match(line)
                if connected_match:
                    connection_info = connected_match.group(1).strip()
                    target_device = connection_info.split(" - ")[0].strip() if " - " in connection_info else connection_info.split()[0]
                    self.links.append({
                        "from": current_device["name"],
                        "to": target_device
                    })
                    continue
                
                # If we're in a device section, skip other parsing for most lines
                # except for connection lines
                if not any(conn_word in line.lower() for conn_word in ['<->', 'connects', 'connected', 'link']):
                    continue
            
            # Connection patterns with arrows (R1 GigabitEthernet0/0 <-> S1 FastEthernet0/1)
            connection_arrow_match = connection_arrow_pattern.search(line)
            if connection_arrow_match:
                device1 = connection_arrow_match.group(1).strip()
                device2 = connection_arrow_match.group(2).strip()
                
                if len(device1) <= 20 and len(device2) <= 20:
                    self._ensure_device_exists(device1)
                    self._ensure_device_exists(device2)
                    self.links.append({"from": device1, "to": device2})
                continue
            
            # 3. Tabular format (device | type | ip) - check before simple patterns
            tabular_match = tabular_pattern.match(line)
            if tabular_match and '|' in line:  # Ensure it's actually tabular
                device_name = tabular_match.group(1).strip()
                device_type = tabular_match.group(2).strip()
                device_ip = tabular_match.group(3) if tabular_match.group(3) else ""
                
                # Skip header row
                if device_name.lower() != 'device' and device_type.lower() != 'type':
                    self.devices.append({
                        "name": device_name,
                        "type": self._normalize_device_type(device_type),
                        "ip": device_ip
                    })
                continue
            
            # 4. Simple device declarations (Router1, Switch0, etc.) - but be more specific
            simple_device_match = simple_device_pattern.match(line)
            if simple_device_match and len(line.split()) <= 3:  # Avoid matching long lines
                device_type = simple_device_match.group(1)
                device_name = f"{device_type}{simple_device_match.group(2)}"
                device_ip = simple_device_match.group(3) if simple_device_match.group(3) else ""
                
                self.devices.append({
                    "name": device_name,
                    "type": self._normalize_device_type(device_type),
                    "ip": device_ip
                })
                continue
            
            # 5. Connection patterns (Router1 - Switch1) - only if line is short and simple
            if len(line.split()) <= 5:  # Only for simple connection lines
                connection_dash_match = connection_dash_pattern.match(line)
                if connection_dash_match:
                    device1 = connection_dash_match.group(1).strip()
                    device2 = connection_dash_match.group(2).strip()
                    
                    # Check if device2 is an IP address
                    if re.match(r'^\d+\.\d+\.\d+\.\d+$', device2):
                        # This is device - IP format, add device with IP
                        self._ensure_device_exists_with_ip(device1, device2)
                    else:
                        # This is device - device connection
                        if len(device1) <= 20 and len(device2) <= 20 and not any(c in device1 + device2 for c in '.,;:()[]{}'):
                            self._ensure_device_exists(device1)
                            self._ensure_device_exists(device2)
                            self.links.append({"from": device1, "to": device2})
                    continue
            
            # 6. Connection word patterns (Router1 connects to Switch1)
            connection_word_match = connection_word_pattern.match(line)
            if connection_word_match:
                device1 = connection_word_match.group(1).strip()
                device2 = connection_word_match.group(2).strip()
                
                if len(device1) <= 20 and len(device2) <= 20:
                    self._ensure_device_exists(device1)
                    self._ensure_device_exists(device2)
                    self.links.append({"from": device1, "to": device2})
                continue
        
        # Add the last device if it exists
        if current_device and current_device["name"]:
            self.devices.append(current_device.copy())
        
        # If no devices found, try to extract from IP addresses (fallback)
        if not self.devices:
            ips = ip_pattern.findall(content)
            for i, ip in enumerate(set(ips)):
                device_type = "PC" if ip.endswith(('.10', '.11', '.12', '.20', '.21', '.22')) else "Router"
                self.devices.append({
                    "name": f"{device_type}{i}",
                    "type": device_type,
                    "ip": ip
                })
        
        # If no devices found, try to extract from IP addresses (fallback)
        if not self.devices:
            ips = ip_pattern.findall(content)
            for i, ip in enumerate(set(ips)):
                device_type = "PC" if ip.endswith(('.10', '.11', '.12', '.20', '.21', '.22')) else "Router"
                self.devices.append({
                    "name": f"{device_type}{i}",
                    "type": device_type,
                    "ip": ip
                })
        
        # Remove duplicate devices
        unique_devices = []
        seen_names = set()
        for device in self.devices:
            if device["name"] not in seen_names:
                unique_devices.append(device)
                seen_names.add(device["name"])
        self.devices = unique_devices
        
        # Remove duplicate links
        unique_links = []
        seen_links = set()
        for link in self.links:
            link_key = (link["from"], link["to"])
            reverse_key = (link["to"], link["from"])
            if link_key not in seen_links and reverse_key not in seen_links:
                unique_links.append(link)
                seen_links.add(link_key)
        self.links = unique_links
        
        return {"devices": self.devices, "links": self.links}
    
    def _normalize_device_type(self, device_type: str) -> str:
        """Normalize device type names to standard types"""
        device_type_lower = device_type.lower()
        
        if 'end device' in device_type_lower or device_type_lower in ['pc', 'computer', 'workstation', 'host']:
            return "PC"
        elif 'router' in device_type_lower:
            return "Router"
        elif 'switch' in device_type_lower:
            return "Switch"
        elif 'server' in device_type_lower:
            return "Server"
        elif 'hub' in device_type_lower:
            return "Hub"
        elif 'bridge' in device_type_lower:
            return "Bridge"
        elif 'firewall' in device_type_lower:
            return "Firewall"
        elif 'access point' in device_type_lower or 'ap' == device_type_lower:
            return "AccessPoint"
        else:
            return device_type.title()
    
    def _ensure_device_exists(self, device_name: str):
        """Ensure a device exists in the devices list, add if not present"""
        for device in self.devices:
            if device["name"] == device_name:
                return
        
        # Try to guess device type from name
        device_type = "Unknown"
        name_lower = device_name.lower()
        if 'router' in name_lower or name_lower.startswith('r'):
            device_type = "Router"
        elif 'switch' in name_lower or name_lower.startswith('sw'):
            device_type = "Switch"
        elif 'pc' in name_lower or name_lower.startswith('pc') or 'host' in name_lower:
            device_type = "PC"
        elif 'server' in name_lower:
            device_type = "Server"
        
        self.devices.append({
            "name": device_name,
            "type": device_type,
            "ip": ""
        })
    
    def _ensure_device_exists_with_ip(self, device_name: str, ip_address: str):
        """Ensure a device exists and update its IP if needed"""
        for device in self.devices:
            if device["name"] == device_name:
                if not device["ip"]:
                    device["ip"] = ip_address
                return
        
        # Create new device with IP
        device_type = "Unknown"
        name_lower = device_name.lower()
        if 'router' in name_lower or name_lower.startswith('r'):
            device_type = "Router"
        elif 'switch' in name_lower or name_lower.startswith('sw'):
            device_type = "Switch"
        elif 'pc' in name_lower or name_lower.startswith('pc') or 'host' in name_lower:
            device_type = "PC"
        elif 'server' in name_lower:
            device_type = "Server"
        
        self.devices.append({
            "name": device_name,
            "type": device_type,
            "ip": ip_address
        })
    
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
    """Upload and parse network file (supports .txt, .xml, and .pkt files)"""
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    try:
        # Read file content
        content = await file.read()
        content_str = None
        
        # Handle PKT files with conversion
        if file_extension == '.pkt':
            try:
                # Save PKT file temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pkt') as temp_file:
                    temp_file.write(content)
                    temp_pkt_path = temp_file.name
                
                # Convert PKT to XML
                converter = PKTConverter()
                xml_content = converter.convert_pkt_to_xml(temp_pkt_path)
                
                if xml_content:
                    content_str = xml_content
                    file_extension = '.xml'  # Treat as XML for parsing
                    conversion_success = True
                else:
                    conversion_success = False
                
                # Cleanup
                converter.cleanup()
                os.unlink(temp_pkt_path)
                
                if not conversion_success:
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "error": "PKT conversion failed",
                            "message": "Could not convert PKT file to readable format",
                            "instructions": [
                                "PKT file conversion failed. Please try one of these alternatives:",
                                "1. Open your .pkt file in Cisco Packet Tracer",
                                "2. Go to File → Export → Export as Text (for .txt export)",
                                "3. Or use File → Export → Export as XML (for .xml export)",
                                "4. Upload the exported .txt or .xml file instead"
                            ],
                            "supported_formats": [".txt", ".xml", ".pkt (with conversion)"]
                        }
                    )
                    
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error": "PKT processing error",
                        "message": f"Error processing PKT file: {str(e)}",
                        "instructions": [
                            "PKT file processing failed. Please try manual export:",
                            "1. Open your .pkt file in Cisco Packet Tracer",
                            "2. Export as Text (.txt) or XML (.xml)",
                            "3. Upload the exported file instead"
                        ]
                    }
                )
        
        # Handle text and XML files
        elif file_extension in ['.txt', '.xml']:
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
                            "suggestion": "If this is a .pkt file, it will be processed with PKT conversion"
                        }
                    )
            
            # Check for binary content patterns
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
                            "1. Rename the file with .pkt extension and upload again",
                            "2. Or open the file in Cisco Packet Tracer",
                            "3. Export as Text (.txt) or XML (.xml)",
                            "4. Upload the exported file instead"
                        ]
                    }
                )
        
        else:
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "Unsupported file format",
                    "message": f"File type '{file_extension}' is not supported",
                    "supported_formats": [".txt", ".xml", ".pkt"],
                    "note": "PKT files will be automatically converted to XML format"
                }
            )
        
        # Parse based on file type
        parser = NetworkParser()
        if file_extension == '.xml':
            result = parser.parse_xml_file(content_str)
        else:
            result = parser.parse_txt_file(content_str)
        
        # Add metadata
        original_extension = os.path.splitext(file.filename)[1].lower()
        result["metadata"] = {
            "filename": file.filename,
            "original_file_type": original_extension,
            "processed_as": file_extension,
            "devices_count": len(result["devices"]),
            "links_count": len(result["links"]),
            "file_size": len(content),
            "pkt_converted": original_extension == '.pkt' and file_extension == '.xml'
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

@app.post("/convert")
async def convert_pkt(file: UploadFile = File(...)):
    """Convert PKT file to XML format"""
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension != '.pkt':
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid file type for conversion",
                "message": "This endpoint only accepts .pkt files",
                "received_type": file_extension,
                "note": "Use the /upload endpoint for .txt and .xml files"
            }
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Save PKT file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pkt') as temp_file:
            temp_file.write(content)
            temp_pkt_path = temp_file.name
        
        # Convert PKT to XML
        converter = PKTConverter()
        xml_content = converter.convert_pkt_to_xml(temp_pkt_path)
        
        # Cleanup
        converter.cleanup()
        os.unlink(temp_pkt_path)
        
        if xml_content:
            return JSONResponse(content={
                "success": True,
                "xml": xml_content,
                "message": "PKT file successfully converted to XML",
                "original_filename": file.filename,
                "conversion_method": "PTExplorer-based conversion"
            })
        else:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Conversion failed",
                    "message": "Could not convert PKT file to XML format",
                    "suggestions": [
                        "The PKT file might be corrupted or in an unsupported format",
                        "Try opening the file in Cisco Packet Tracer and exporting manually",
                        "Ensure the PKT file is from a compatible version of Packet Tracer"
                    ]
                }
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Conversion error",
                "message": f"Error during PKT conversion: {str(e)}",
                "note": "Try manual export from Cisco Packet Tracer if conversion continues to fail"
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
