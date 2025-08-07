#!/usr/bin/env python3

from main import NetworkParser
import re

def debug_enterprise_format():
    with open('../sample_files/enterprise_format.txt', 'r') as f:
        content = f.read()
    
    print('Debugging Enterprise Format:')
    print('=' * 50)
    
    lines = content.split('\n')
    current_device = None
    
    # Same patterns as in main.py
    enterprise_device_pattern = re.compile(r'^(Router|Switch|PC|Server|Hub|Bridge|Host|Firewall|AP):\s*(.+)', re.IGNORECASE)
    ip_address_pattern = re.compile(r'IP\s*(?:Address)?:\s*(\d+\.\d+\.\d+\.\d+)', re.IGNORECASE)
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Check for device declarations
        enterprise_match = enterprise_device_pattern.match(line)
        if enterprise_match:
            if current_device:
                print(f"Finished device: {current_device}")
            device_type = enterprise_match.group(1).strip()
            device_name = enterprise_match.group(2).strip()
            current_device = {
                "name": device_name,
                "type": device_type,
                "ip": ""
            }
            print(f"Line {i+1}: Found device - {device_name} ({device_type})")
            continue
        
        # Check for IP addresses
        if current_device:
            ip_match = ip_address_pattern.match(line)
            if ip_match:
                current_device["ip"] = ip_match.group(1)
                print(f"Line {i+1}: Found IP for {current_device['name']}: {ip_match.group(1)}")
                continue
            
            # Look for IP anywhere in line
            ip_anywhere = re.search(r'(\d+\.\d+\.\d+\.\d+)', line)
            if ip_anywhere and not current_device["ip"]:
                print(f"Line {i+1}: Potential IP in line '{line}': {ip_anywhere.group(1)}")
    
    if current_device:
        print(f"Final device: {current_device}")

if __name__ == "__main__":
    debug_enterprise_format()
