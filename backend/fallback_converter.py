
# Fallback PKT converter
import struct
import os

def simple_pkt_to_xml(pkt_path):
    """Simple PKT to XML converter fallback"""
    try:
        with open(pkt_path, 'rb') as f:
            data = f.read()
        
        # Basic extraction of readable strings
        strings = []
        current_string = ""
        
        for byte in data:
            if 32 <= byte <= 126:  # Printable ASCII
                current_string += chr(byte)
            else:
                if len(current_string) > 3:
                    strings.append(current_string)
                current_string = ""
        
        # Create basic XML
        xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<network>']
        
        device_count = 0
        for s in strings:
            if any(keyword in s.lower() for keyword in ['router', 'switch', 'pc', 'server']):
                xml_lines.append(f'  <device name="{s}" type="Unknown" ip="192.168.1.{device_count + 1}" />')
                device_count += 1
                if device_count >= 10:  # Limit devices
                    break
        
        xml_lines.append('</network>')
        return '\n'.join(xml_lines)
        
    except Exception:
        return None
