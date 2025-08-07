"""
Test script for PKT converter functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from pkt_converter import PKTConverter

def test_pkt_converter():
    """Test the PKT converter with a sample binary file"""
    
    # Create a mock PKT file with some binary data and embedded strings
    test_pkt_content = b'''
\x00\x01\x02\x03PKT_FILE_HEADER\x00\x00\x00
Router1\x00\x00Switch1\x00\x00PC1\x00\x00Server1\x00
192.168.1.1\x00192.168.1.2\x00192.168.1.10\x00192.168.1.100\x00
<device name="Router1" type="Router" ip="192.168.1.1"/>
{"name": "Switch1", "type": "Switch", "ip": "192.168.1.2"}
connect Router1 Switch1
Router1 -> PC1
Switch1 - Server1
\x00\x00\x00END_PKT_FILE\x00\x00\x00
'''
    
    # Write test PKT file
    test_file_path = "test_network.pkt"
    with open(test_file_path, 'wb') as f:
        f.write(test_pkt_content)
    
    print("Created test PKT file")
    
    # Test the converter
    converter = PKTConverter()
    
    print("Testing PKT conversion...")
    xml_result = converter.convert_pkt_to_xml(test_file_path)
    
    if xml_result:
        print("✅ PKT conversion successful!")
        print("\nGenerated XML:")
        print("-" * 50)
        print(xml_result)
        print("-" * 50)
        
        # Write XML output for inspection
        with open("test_output.xml", 'w', encoding='utf-8') as f:
            f.write(xml_result)
        print("\nXML output saved to test_output.xml")
        
    else:
        print("❌ PKT conversion failed")
    
    # Cleanup
    converter.cleanup()
    
    # Clean up test files
    try:
        os.remove(test_file_path)
        print(f"\nCleaned up {test_file_path}")
    except:
        pass

if __name__ == "__main__":
    test_pkt_converter()
