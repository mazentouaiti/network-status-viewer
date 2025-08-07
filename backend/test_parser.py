#!/usr/bin/env python3

from main import NetworkParser

def test_parser():
    # Read the sample file
    with open('../sample_files/network_sample.txt', 'r') as f:
        content = f.read()

    # Parse it
    parser = NetworkParser()
    result = parser.parse_txt_file(content)

    print('Devices found:')
    for device in result['devices']:
        print(f'  - {device["name"]} ({device["type"]}) - IP: {device["ip"]}')

    print('\nConnections found:')
    for link in result['links']:
        print(f'  - {link["from"]} -> {link["to"]}')

    print(f'\nTotal devices: {len(result["devices"])}')
    print(f'Total connections: {len(result["links"])}')
    
    return result

if __name__ == "__main__":
    test_parser()
