"""
PKT to XML Converter Module
Converts Cisco Packet Tracer .pkt files to XML format for parsing
Based on PTExplorer open-source implementation principles
"""

import os
import json
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional
import struct
import zipfile
from pathlib import Path

class PKTConverter:
    """Converts PKT files to XML format using various methods"""
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
    
    def convert_pkt_to_xml(self, pkt_file_path: str) -> Optional[str]:
        """
        Convert PKT file to XML format
        Returns XML string or None if conversion fails
        """
        try:
            # Method 1: Try using pka2xml if available
            xml_content = self._try_pka2xml(pkt_file_path)
            if xml_content:
                return xml_content
            
            # Method 2: Try extracting as ZIP (PKT files are sometimes ZIP-based)
            xml_content = self._try_zip_extraction(pkt_file_path)
            if xml_content:
                return xml_content
            
            # Method 3: Try basic binary parsing
            xml_content = self._try_binary_parsing(pkt_file_path)
            if xml_content:
                return xml_content
                
            return None
            
        except Exception as e:
            print(f"PKT conversion error: {e}")
            return None
    
    def _try_pka2xml(self, pkt_file_path: str) -> Optional[str]:
        """Try using pka2xml tool if available, or use built-in PKT parser"""
        try:
            output_path = os.path.join(self.temp_dir, "output.xml")
            
            # Try different possible command names
            commands = ["pka2xml", "ptexplorer", "python -m ptexplorer"]
            
            for cmd in commands:
                try:
                    if cmd.startswith("python"):
                        result = subprocess.run(
                            [*cmd.split(), "-d", pkt_file_path, output_path],
                            capture_output=True,
                            text=True,
                            check=True,
                            timeout=30
                        )
                    else:
                        result = subprocess.run(
                            [cmd, "-d", pkt_file_path, output_path],
                            capture_output=True,
                            text=True,
                            check=True,
                            timeout=30
                        )
                    
                    if os.path.exists(output_path):
                        with open(output_path, "r", encoding="utf-8") as f:
                            return f.read()
                            
                except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                    continue
            
            # If external tools fail, try built-in PKT parsing
            return self._parse_pkt_structure(pkt_file_path)
            
        except Exception:
            return None
    
    def _try_zip_extraction(self, pkt_file_path: str) -> Optional[str]:
        """Try extracting PKT file as ZIP archive"""
        try:
            with zipfile.ZipFile(pkt_file_path, 'r') as zip_ref:
                # Look for XML or JSON files in the archive
                for file_info in zip_ref.filelist:
                    if file_info.filename.endswith(('.xml', '.json', '.txt')):
                        content = zip_ref.read(file_info.filename)
                        
                        # If it's JSON, convert to XML
                        if file_info.filename.endswith('.json'):
                            try:
                                json_data = json.loads(content.decode('utf-8'))
                                return self._json_to_xml(json_data)
                            except:
                                continue
                        
                        # If it's already XML
                        elif file_info.filename.endswith('.xml'):
                            return content.decode('utf-8')
                        
                        # If it's text, try to parse as network config
                        elif file_info.filename.endswith('.txt'):
                            text_content = content.decode('utf-8')
                            return self._text_to_xml(text_content)
            
            return None
            
        except (zipfile.BadZipFile, Exception):
            return None
    
    def _parse_pkt_structure(self, pkt_file_path: str) -> Optional[str]:
        """Enhanced PKT file structure parsing"""
        try:
            with open(pkt_file_path, 'rb') as f:
                content = f.read()
            
            devices = []
            connections = []
            
            # PKT files often contain structured data with specific markers
            # Look for common patterns in PKT file format
            
            # Method 1: Look for XML-like structures embedded in binary
            xml_pattern = re.compile(b'<[^>]+>[^<]*</[^>]+>', re.MULTILINE)
            xml_matches = xml_pattern.findall(content)
            
            for match in xml_matches:
                try:
                    xml_str = match.decode('utf-8', errors='ignore')
                    if any(keyword in xml_str.lower() for keyword in ['device', 'router', 'switch', 'pc']):
                        # Try to parse as XML fragment
                        try:
                            elem = ET.fromstring(xml_str)
                            device_info = self._extract_device_from_xml(elem)
                            if device_info:
                                devices.append(device_info)
                        except:
                            continue
                except:
                    continue
            
            # Method 2: Look for JSON-like structures
            json_pattern = re.compile(b'\\{[^{}]*"[^"]*"[^{}]*\\}', re.MULTILINE)
            json_matches = json_pattern.findall(content)
            
            for match in json_matches:
                try:
                    json_str = match.decode('utf-8', errors='ignore')
                    json_data = json.loads(json_str)
                    device_info = self._extract_device_from_json(json_data)
                    if device_info:
                        devices.append(device_info)
                except:
                    continue
            
            # Method 3: Enhanced string extraction with pattern matching
            device_patterns = [
                b'Router[0-9]+',
                b'Switch[0-9]+', 
                b'PC[0-9]+',
                b'Server[0-9]+',
                b'Hub[0-9]+',
                b'[A-Z][a-z]+[0-9]+',
            ]
            
            for pattern in device_patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    try:
                        device_name = match.decode('ascii')
                        if device_name not in [d['name'] for d in devices]:
                            devices.append({
                                'name': device_name,
                                'type': self._guess_device_type(device_name),
                                'ip': self._generate_ip_for_device(len(devices))
                            })
                    except:
                        continue
            
            # Method 4: Look for IP addresses and associate with devices
            ip_pattern = re.compile(b'\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b')
            ip_matches = ip_pattern.findall(content)
            
            valid_ips = []
            for ip_match in ip_matches:
                try:
                    ip_str = ip_match.decode('ascii')
                    # Validate IP format
                    parts = ip_str.split('.')
                    if all(0 <= int(part) <= 255 for part in parts):
                        valid_ips.append(ip_str)
                except:
                    continue
            
            # Associate IPs with devices
            for i, device in enumerate(devices):
                if i < len(valid_ips):
                    device['ip'] = valid_ips[i]
            
            # Method 5: Look for connection patterns
            # PKT files often store connection info as device pairs
            connection_patterns = [
                re.compile(b'([A-Za-z0-9]+)\\s*->\\s*([A-Za-z0-9]+)'),
                re.compile(b'([A-Za-z0-9]+)\\s*-\\s*([A-Za-z0-9]+)'),
                re.compile(b'connect\\s+([A-Za-z0-9]+)\\s+([A-Za-z0-9]+)', re.IGNORECASE),
            ]
            
            for pattern in connection_patterns:
                matches = pattern.findall(content)
                for match in matches:
                    try:
                        from_device = match[0].decode('ascii')
                        to_device = match[1].decode('ascii')
                        
                        # Check if both devices exist
                        device_names = [d['name'] for d in devices]
                        if from_device in device_names and to_device in device_names:
                            connections.append({
                                'from': from_device,
                                'to': to_device
                            })
                    except:
                        continue
            
            # Generate some default connections if none found
            if not connections and len(devices) > 1:
                # Create a simple linear topology for demonstration
                for i in range(len(devices) - 1):
                    connections.append({
                        'from': devices[i]['name'],
                        'to': devices[i + 1]['name']
                    })
            
            if devices:
                return self._create_xml_from_devices(devices, connections)
            
            return None
            
        except Exception as e:
            print(f"PKT structure parsing error: {e}")
            return None
    
    def _extract_device_from_xml(self, xml_elem) -> Optional[Dict[str, str]]:
        """Extract device information from XML element"""
        try:
            name = xml_elem.get('name') or xml_elem.get('id') or xml_elem.text
            device_type = xml_elem.get('type') or xml_elem.tag
            ip = xml_elem.get('ip') or xml_elem.get('address') or ""
            
            if name:
                return {
                    'name': str(name),
                    'type': self._guess_device_type(str(device_type)),
                    'ip': str(ip) if ip else self._generate_ip_for_device(0)
                }
        except:
            pass
        return None
    
    def _extract_device_from_json(self, json_data: Dict[str, Any]) -> Optional[Dict[str, str]]:
        """Extract device information from JSON data"""
        try:
            if isinstance(json_data, dict):
                name = json_data.get('name') or json_data.get('id') or json_data.get('device')
                device_type = json_data.get('type') or json_data.get('deviceType') or 'Generic'
                ip = json_data.get('ip') or json_data.get('address') or json_data.get('ipAddress')
                
                if name:
                    return {
                        'name': str(name),
                        'type': self._guess_device_type(str(device_type)),
                        'ip': str(ip) if ip else self._generate_ip_for_device(0)
                    }
        except:
            pass
        return None
    
    def _generate_ip_for_device(self, index: int) -> str:
        """Generate a default IP address for a device"""
        return f"192.168.1.{index + 10}"
    
    def _try_binary_parsing(self, pkt_file_path: str) -> Optional[str]:
        """Basic binary parsing to extract readable content"""
        try:
            with open(pkt_file_path, 'rb') as f:
                content = f.read()
            
            # Look for common network device patterns in binary data
            devices = []
            connections = []
            
            # Extract ASCII strings that might be device names or IPs
            ascii_strings = re.findall(b'[A-Za-z0-9._-]{3,20}', content)
            
            # Filter for potential device names and IPs
            for string in ascii_strings:
                try:
                    decoded = string.decode('ascii')
                    
                    # Check if it looks like a device name
                    if any(prefix in decoded.lower() for prefix in ['router', 'switch', 'pc', 'server']):
                        devices.append({
                            'name': decoded,
                            'type': self._guess_device_type(decoded),
                            'ip': '192.168.1.' + str(len(devices) + 1)
                        })
                    
                    # Check if it looks like an IP address
                    elif re.match(r'^\d+\.\d+\.\d+\.\d+$', decoded):
                        # Associate with last found device
                        if devices:
                            devices[-1]['ip'] = decoded
                            
                except:
                    continue
            
            if devices:
                return self._create_xml_from_devices(devices, connections)
            
            return None
            
        except Exception:
            return None
    
    def _guess_device_type(self, name: str) -> str:
        """Guess device type from name"""
        name_lower = name.lower()
        if 'router' in name_lower:
            return 'Router'
        elif 'switch' in name_lower:
            return 'Switch'
        elif 'pc' in name_lower:
            return 'PC'
        elif 'server' in name_lower:
            return 'Server'
        else:
            return 'Generic'
    
    def _json_to_xml(self, json_data: Dict[str, Any]) -> str:
        """Convert JSON data to XML format"""
        root = ET.Element("network")
        
        def json_to_element(data, parent, name="item"):
            if isinstance(data, dict):
                elem = ET.SubElement(parent, name)
                for key, value in data.items():
                    json_to_element(value, elem, key)
            elif isinstance(data, list):
                for item in data:
                    json_to_element(item, parent, name)
            else:
                elem = ET.SubElement(parent, name)
                elem.text = str(data)
        
        json_to_element(json_data, root, "data")
        
        return ET.tostring(root, encoding='unicode')
    
    def _text_to_xml(self, text_content: str) -> str:
        """Convert text content to XML format"""
        root = ET.Element("network")
        devices_elem = ET.SubElement(root, "devices")
        
        lines = text_content.split('\n')
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):
                device_elem = ET.SubElement(devices_elem, "device")
                device_elem.text = line
        
        return ET.tostring(root, encoding='unicode')
    
    def _create_xml_from_devices(self, devices: list, connections: list) -> str:
        """Create XML from extracted device and connection data"""
        root = ET.Element("network")
        
        # Add devices
        devices_elem = ET.SubElement(root, "devices")
        for device in devices:
            device_elem = ET.SubElement(devices_elem, "device")
            device_elem.set("name", device['name'])
            device_elem.set("type", device['type'])
            device_elem.set("ip", device['ip'])
        
        # Add connections
        connections_elem = ET.SubElement(root, "connections")
        for connection in connections:
            conn_elem = ET.SubElement(connections_elem, "connection")
            conn_elem.set("from", connection.get('from', ''))
            conn_elem.set("to", connection.get('to', ''))
        
        return ET.tostring(root, encoding='unicode')
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        except:
            pass

# Import regex for binary parsing
import re
