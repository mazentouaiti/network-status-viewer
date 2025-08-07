#!/usr/bin/env python3

from main import NetworkParser
import os

def test_all_formats():
    test_files = [
        "../sample_files/network_sample.txt",
        "../sample_files/simple_format.txt", 
        "../sample_files/dash_format.txt",
        "../sample_files/tabular_format.txt"
    ]
    
    parser = NetworkParser()
    
    for test_file in test_files:
        if os.path.exists(test_file):
            print(f"\n{'='*50}")
            print(f"Testing: {test_file}")
            print(f"{'='*50}")
            
            with open(test_file, 'r') as f:
                content = f.read()
            
            result = parser.parse_txt_file(content)
            
            print('Devices found:')
            for device in result['devices']:
                print(f'  - {device["name"]} ({device["type"]}) - IP: {device["ip"]}')
            
            print('\nConnections found:')
            for link in result['links']:
                print(f'  - {link["from"]} -> {link["to"]}')
            
            print(f'\nTotal devices: {len(result["devices"])}')
            print(f'Total connections: {len(result["links"])}')

if __name__ == "__main__":
    test_all_formats()
