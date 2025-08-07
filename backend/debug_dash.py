#!/usr/bin/env python3

from main import NetworkParser

def debug_dash_format():
    with open('../sample_files/dash_format.txt', 'r') as f:
        content = f.read()
    
    print('File content:')
    print(repr(content))
    
    parser = NetworkParser()
    result = parser.parse_txt_file(content)
    
    print('\nDevices found:')
    for device in result['devices']:
        print(f'  - {device["name"]} ({device["type"]}) - IP: {device["ip"]}')
    
    print('\nConnections found:')
    for link in result['links']:
        print(f'  - {link["from"]} -> {link["to"]}')

if __name__ == "__main__":
    debug_dash_format()
