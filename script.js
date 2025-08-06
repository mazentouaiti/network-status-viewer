// Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// Global variables
let networkData = null;
let cy = null;
let isDarkMode = false;
let filteredDevices = [];
let filteredConnections = [];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadContent = document.getElementById('uploadContent');
const loadingContent = document.getElementById('loadingContent');
const messageArea = document.getElementById('messageArea');
const resultsSection = document.getElementById('resultsSection');
const devicesTableBody = document.getElementById('devicesTableBody');
const connectionsTableBody = document.getElementById('connectionsTableBody');
const darkModeToggle = document.getElementById('darkModeToggle');
const clearDataBtn = document.getElementById('clearDataBtn');
const deviceSearch = document.getElementById('deviceSearch');
const connectionSearch = document.getElementById('connectionSearch');
const deviceCount = document.getElementById('deviceCount');
const connectionCount = document.getElementById('connectionCount');
const networkHealth = document.getElementById('networkHealth');
const progressFill = document.getElementById('progressFill');
const emptyState = document.getElementById('emptyState');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeCytoscape();
    checkDarkModePreference();
});

function setupEventListeners() {
    // File upload area click
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);

    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Clear data button
    clearDataBtn.addEventListener('click', clearData);

    // Search functionality
    deviceSearch.addEventListener('input', filterDevices);
    connectionSearch.addEventListener('input', filterConnections);

    // Network controls
    document.getElementById('fitViewBtn').addEventListener('click', () => cy && cy.fit());
    document.getElementById('centerBtn').addEventListener('click', () => cy && cy.center());
    document.getElementById('layoutBtn').addEventListener('click', () => cy && runLayout());
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // Export buttons
    document.getElementById('exportDevicesBtn').addEventListener('click', exportDevicesCSV);
    document.getElementById('exportConnectionsBtn').addEventListener('click', exportConnectionsCSV);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    const allowedTypes = ['.txt', '.xml', '.pkt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showMessage('Please select a .txt, .xml, or .pkt file from Cisco Packet Tracer', 'error');
        return;
    }

    // Special handling for .pkt files
    if (fileExtension === '.pkt') {
        showPktFileGuidance(file.name);
        return;
    }

    uploadFile(file);
}

function showPktFileGuidance(filename) {
    const guidanceHtml = `
        <div class="border-l-4 border-orange-500 bg-orange-50 p-6">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-lg font-medium text-orange-800">PKT File Detected: ${filename}</h3>
                    <div class="mt-2 text-sm text-orange-700">
                        <p class="mb-3">PKT files are binary format and cannot be directly parsed. Please export your network topology first:</p>
                        <div class="bg-white rounded-lg p-4 border border-orange-200">
                            <h4 class="font-semibold mb-2">📋 Export Instructions:</h4>
                            <ol class="list-decimal list-inside space-y-1 text-sm">
                                <li>Open <strong>${filename}</strong> in Cisco Packet Tracer</li>
                                <li>Go to <strong>File → Export</strong></li>
                                <li>Choose one of these options:
                                    <ul class="list-disc list-inside ml-4 mt-1 space-y-1">
                                        <li><strong>Export as Text</strong> (creates .txt file)</li>
                                        <li><strong>Export as XML</strong> (creates .xml file)</li>
                                    </ul>
                                </li>
                                <li>Save the exported file</li>
                                <li>Upload the exported .txt or .xml file here</li>
                            </ol>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button onclick="clearPktGuidance()" class="btn-secondary">Got it</button>
                            <button onclick="showExportDemo()" class="btn-secondary">📺 Show Export Demo</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    messageArea.innerHTML = guidanceHtml;
}

function clearPktGuidance() {
    messageArea.innerHTML = '';
}

function showExportDemo() {
    const demoHtml = `
        <div class="border-l-4 border-blue-500 bg-blue-50 p-6">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-lg font-medium text-blue-800">📺 Export Demo</h3>
                    <div class="mt-2 text-sm text-blue-700">
                        <p class="mb-3">Follow these visual steps to export your PKT file:</p>
                        <div class="bg-white rounded-lg p-4 border border-blue-200">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="text-center">
                                    <div class="bg-gray-100 rounded-lg p-4 mb-2">
                                        <div class="text-2xl mb-2">🖥️</div>
                                        <div class="text-xs">Step 1: Open PKT file</div>
                                    </div>
                                    <p class="text-xs">Launch Cisco Packet Tracer and open your .pkt file</p>
                                </div>
                                <div class="text-center">
                                    <div class="bg-gray-100 rounded-lg p-4 mb-2">
                                        <div class="text-2xl mb-2">📁</div>
                                        <div class="text-xs">Step 2: File Menu</div>
                                    </div>
                                    <p class="text-xs">Click on File → Export in the menu bar</p>
                                </div>
                                <div class="text-center">
                                    <div class="bg-gray-100 rounded-lg p-4 mb-2">
                                        <div class="text-2xl mb-2">📄</div>
                                        <div class="text-xs">Step 3: Choose Format</div>
                                    </div>
                                    <p class="text-xs">Select "Export as Text" or "Export as XML"</p>
                                </div>
                                <div class="text-center">
                                    <div class="bg-gray-100 rounded-lg p-4 mb-2">
                                        <div class="text-2xl mb-2">⬆️</div>
                                        <div class="text-xs">Step 4: Upload Here</div>
                                    </div>
                                    <p class="text-xs">Upload the exported file to this application</p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button onclick="clearPktGuidance()" class="btn-secondary">Close Demo</button>
                            <a href="#" onclick="downloadSamplePkt()" class="btn-secondary">📥 Download Sample PKT</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    messageArea.innerHTML = demoHtml;
}

function downloadSamplePkt() {
    showMessage('Sample PKT files are not available for download, but you can create a simple network in Cisco Packet Tracer and practice the export process.', 'info');
}

function showMessage(message, type = 'info') {
    const bgColor = type === 'error' ? 'bg-red-100 border-red-500 text-red-700' :
                   type === 'success' ? 'bg-green-100 border-green-500 text-green-700' :
                   'bg-blue-100 border-blue-500 text-blue-700';
    
    messageArea.innerHTML = `
        <div class="border-l-4 p-4 ${bgColor}">
            <p>${message}</p>
        </div>
    `;
    
    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            messageArea.innerHTML = '';
        }, 5000);
    }
}

function showLoading(show) {
    if (show) {
        uploadContent.classList.add('hidden');
        loadingContent.classList.remove('hidden');
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 100);
        
        // Store interval for cleanup
        loadingContent.dataset.interval = interval;
    } else {
        uploadContent.classList.remove('hidden');
        loadingContent.classList.add('hidden');
        progressFill.style.width = '100%';
        setTimeout(() => {
            progressFill.style.width = '0%';
        }, 500);
        
        // Clear interval
        if (loadingContent.dataset.interval) {
            clearInterval(loadingContent.dataset.interval);
            delete loadingContent.dataset.interval;
        }
    }
}

function checkDarkModePreference() {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
        toggleDarkMode();
    }
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    darkModeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('darkMode', isDarkMode);
}

function clearData() {
    networkData = null;
    resultsSection.classList.add('hidden');
    clearDataBtn.classList.add('hidden');
    emptyState.classList.remove('hidden');
    messageArea.innerHTML = '';
    if (cy) {
        cy.elements().remove();
    }
    updateStats(0, 0);
    showMessage('Data cleared successfully', 'success');
}

function updateStats(devices, connections) {
    deviceCount.textContent = devices;
    connectionCount.textContent = connections;
    
    // Calculate network health (simple heuristic)
    if (devices === 0) {
        networkHealth.textContent = '--';
    } else {
        let health = 100;
        const avgConnections = connections / devices;
        if (avgConnections < 1) health = 60;
        else if (avgConnections < 2) health = 80;
        networkHealth.textContent = health + '%';
    }
}

function filterDevices() {
    const searchTerm = deviceSearch.value.toLowerCase();
    if (!networkData) return;
    
    filteredDevices = networkData.devices.filter(device => 
        device.name.toLowerCase().includes(searchTerm) ||
        device.type.toLowerCase().includes(searchTerm) ||
        (device.ip && device.ip.toLowerCase().includes(searchTerm))
    );
    
    populateDevicesTable(filteredDevices);
}

function filterConnections() {
    const searchTerm = connectionSearch.value.toLowerCase();
    if (!networkData) return;
    
    filteredConnections = networkData.links.filter(link => 
        link.from.toLowerCase().includes(searchTerm) ||
        link.to.toLowerCase().includes(searchTerm)
    );
    
    populateConnectionsTable(filteredConnections);
}

function exportDevicesCSV() {
    if (!networkData || !networkData.devices.length) {
        showMessage('No device data to export', 'error');
        return;
    }
    
    const csv = generateCSV(filteredDevices.length ? filteredDevices : networkData.devices, 
        ['name', 'type', 'ip'], ['Device Name', 'Type', 'IP Address']);
    downloadCSV(csv, 'network_devices.csv');
}

function exportConnectionsCSV() {
    if (!networkData || !networkData.links.length) {
        showMessage('No connection data to export', 'error');
        return;
    }
    
    const csv = generateCSV(filteredConnections.length ? filteredConnections : networkData.links, 
        ['from', 'to'], ['From Device', 'To Device']);
    downloadCSV(csv, 'network_connections.csv');
}

function generateCSV(data, fields, headers) {
    const csvContent = [
        headers.join(','),
        ...data.map(item => fields.map(field => `"${item[field] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showMessage(`${filename} downloaded successfully`, 'success');
    }
}

function toggleFullscreen() {
    const cyContainer = document.getElementById('cy');
    if (!document.fullscreenElement) {
        cyContainer.requestFullscreen().then(() => {
            cyContainer.style.height = '100vh';
            cy.resize();
            cy.fit();
        });
    } else {
        document.exitFullscreen().then(() => {
            cyContainer.style.height = '24rem';
            cy.resize();
            cy.fit();
        });
    }
}

function runLayout() {
    if (!cy) return;
    
    const layout = cy.layout({
        name: 'cola',
        animate: true,
        randomize: true,
        maxSimulationTime: 2000,
        nodeSpacing: function(node) { return 60; },
        edgeLength: function(edge) { return 120; }
    });
    
    layout.run();
}

async function uploadFile(file) {
    showLoading(true);
    messageArea.innerHTML = '';
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Upload failed');
        }
        
        const data = await response.json();
        
        // Handle detailed error responses (like PKT file errors)
        if (!response.ok) {
            if (data.error && data.instructions) {
                showDetailedError(data);
            } else {
                throw new Error(data.detail || data.message || 'Upload failed');
            }
            return;
        }
        
        networkData = data;
        
        showMessage(`File processed successfully! Found ${data.devices.length} devices and ${data.links.length} connections.`, 'success');
        displayResults(data);
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Try to parse error response for detailed information
        if (error.message && error.message.includes('{')) {
            try {
                const errorData = JSON.parse(error.message);
                if (errorData.error && errorData.instructions) {
                    showDetailedError(errorData);
                    return;
                }
            } catch (e) {
                // Fall through to generic error handling
            }
        }
        
        showMessage(error.message || 'Failed to upload file. Make sure the backend server is running.', 'error');
    } finally {
        showLoading(false);
    }
}

function showDetailedError(errorData) {
    let instructionsHtml = '';
    if (errorData.instructions && Array.isArray(errorData.instructions)) {
        instructionsHtml = `
            <ol class="list-decimal list-inside space-y-1 text-sm mt-2">
                ${errorData.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
            </ol>
        `;
    }
    
    const supportedFormats = errorData.supported_formats ? 
        errorData.supported_formats.join(', ') : '.txt, .xml';
    
    const detailedErrorHtml = `
        <div class="border-l-4 border-red-500 bg-red-50 p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">${errorData.error || 'File Error'}</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>${errorData.message}</p>
                        ${instructionsHtml}
                        ${errorData.note ? `<p class="mt-2 text-xs"><strong>Note:</strong> ${errorData.note}</p>` : ''}
                        <p class="mt-2 text-xs"><strong>Supported formats:</strong> ${supportedFormats}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    messageArea.innerHTML = detailedErrorHtml;
}

function displayResults(data) {
    // Hide empty state and show results section with animation
    emptyState.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    clearDataBtn.classList.remove('hidden');
    
    // Update statistics
    updateStats(data.devices.length, data.links.length);
    
    // Reset filters
    filteredDevices = data.devices;
    filteredConnections = data.links;
    
    // Populate tables
    populateDevicesTable(data.devices);
    populateConnectionsTable(data.links);
    
    // Update network visualization
    updateNetworkVisualization(data);
    
    // Scroll to results with smooth animation
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function populateDevicesTable(devices) {
    devicesTableBody.innerHTML = '';
    
    if (devices.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <svg class="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p class="text-lg font-medium text-gray-400 mb-2">No devices found</p>
                    <p class="text-sm text-gray-400">Upload a network file to see device information</p>
                </div>
            </td>
        `;
        devicesTableBody.appendChild(row);
        return;
    }
    
    devices.forEach((device, index) => {
        const row = document.createElement('tr');
        row.className = 'table-row';
        row.style.animationDelay = `${index * 0.05}s`;
        
        // Generate device icon based on type
        const deviceIcon = getDeviceIcon(device.type);
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div class="flex items-center">
                    <span class="device-icon">${deviceIcon}</span>
                    ${device.name}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDeviceTypeColor(device.type)}">
                    ${device.type}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <code class="bg-gray-100 px-2 py-1 rounded text-xs">${device.ip || 'N/A'}</code>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="status-indicator status-online"></span>
                <span class="text-green-600 font-medium">Online</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="highlightDevice('${device.name}')">Locate</button>
                <button class="text-gray-600 hover:text-gray-900" onclick="showDeviceDetails('${device.name}')">Details</button>
            </td>
        `;
        devicesTableBody.appendChild(row);
    });
}

function populateConnectionsTable(links) {
    connectionsTableBody.innerHTML = '';
    
    if (links.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <svg class="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <p class="text-lg font-medium text-gray-400 mb-2">No connections found</p>
                    <p class="text-sm text-gray-400">Network connections will appear here when devices are linked</p>
                </div>
            </td>
        `;
        connectionsTableBody.appendChild(row);
        return;
    }
    
    links.forEach((link, index) => {
        const row = document.createElement('tr');
        row.className = 'table-row';
        row.style.animationDelay = `${index * 0.05}s`;
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${link.from}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${link.to}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Ethernet
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="status-indicator status-online"></span>
                <span class="text-green-600 font-medium">Active</span>
            </td>
        `;
        connectionsTableBody.appendChild(row);
    });
}

function getDeviceIcon(type) {
    const icons = {
        'Router': '🔀',
        'Switch': '🔌',
        'PC': '💻',
        'Server': '🖥️',
        'Hub': '⚡',
        'Bridge': '🌉'
    };
    return icons[type] || '📱';
}

function highlightDevice(deviceName) {
    if (!cy) return;
    
    cy.elements().removeClass('highlighted');
    const node = cy.getElementById(deviceName);
    if (node.length) {
        node.addClass('highlighted');
        cy.center(node);
        cy.zoom({
            level: 2,
            renderedPosition: node.renderedPosition()
        });
        
        // Add temporary highlight style
        node.style('border-width', '6px');
        node.style('border-color', '#ff6b6b');
        
        setTimeout(() => {
            node.style('border-width', '0px');
        }, 2000);
    }
}

function showDeviceDetails(deviceName) {
    if (!networkData) return;
    
    const device = networkData.devices.find(d => d.name === deviceName);
    if (device) {
        const connections = networkData.links.filter(l => l.from === deviceName || l.to === deviceName);
        
        const details = `
            <strong>Device:</strong> ${device.name}<br>
            <strong>Type:</strong> ${device.type}<br>
            <strong>IP:</strong> ${device.ip || 'N/A'}<br>
            <strong>Connections:</strong> ${connections.length}
        `;
        
        showMessage(details, 'info');
    }
}

function getDeviceTypeColor(type) {
    const colors = {
        'Router': 'bg-blue-100 text-blue-800',
        'Switch': 'bg-green-100 text-green-800',
        'PC': 'bg-yellow-100 text-yellow-800',
        'Server': 'bg-purple-100 text-purple-800',
        'Hub': 'bg-gray-100 text-gray-800',
        'Bridge': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
}

function getDeviceColor(type) {
    const colors = {
        'Router': '#3B82F6',
        'Switch': '#10B981',
        'PC': '#F59E0B',
        'Server': '#8B5CF6',
        'Hub': '#6B7280',
        'Bridge': '#6366F1'
    };
    return colors[type] || '#6B7280';
}

function initializeCytoscape() {
    cy = cytoscape({
        container: document.getElementById('cy'),
        
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': 'data(color)',
                    'label': 'data(label)',
                    'width': 50,
                    'height': 50,
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '11px',
                    'font-weight': 'bold',
                    'color': '#333',
                    'text-outline-width': 2,
                    'text-outline-color': '#fff',
                    'border-width': 2,
                    'border-color': '#fff',
                    'shadow-blur': 6,
                    'shadow-color': 'rgba(0,0,0,0.2)',
                    'shadow-offset-x': 2,
                    'shadow-offset-y': 2
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#cbd5e0',
                    'target-arrow-color': '#cbd5e0',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'arrow-scale': 1.2
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'border-width': 4,
                    'border-color': '#4299e1',
                    'shadow-blur': 10,
                    'shadow-color': 'rgba(66, 153, 225, 0.5)'
                }
            },
            {
                selector: 'node:hover',
                style: {
                    'border-width': 3,
                    'border-color': '#667eea',
                    'transform': 'scale(1.1)'
                }
            },
            {
                selector: 'edge:hover',
                style: {
                    'width': 4,
                    'line-color': '#4299e1'
                }
            }
        ],
        
        layout: {
            name: 'cola',
            animate: true,
            randomize: false,
            maxSimulationTime: 2000,
            nodeSpacing: function(node) { return 60; },
            edgeLength: function(edge) { return 120; }
        }
    });
}

function updateNetworkVisualization(data) {
    if (!cy) return;
    
    // Clear existing elements
    cy.elements().remove();
    
    // Add nodes
    const nodes = data.devices.map(device => ({
        data: {
            id: device.name,
            label: `${device.name}\\n${device.ip || ''}`,
            color: getDeviceColor(device.type),
            type: device.type
        }
    }));
    
    // Add edges
    const edges = data.links.map((link, index) => ({
        data: {
            id: `edge-${index}`,
            source: link.from,
            target: link.to
        }
    }));
    
    // Add elements to cytoscape
    cy.add([...nodes, ...edges]);
    
    // Run layout
    const layout = cy.layout({
        name: 'cola',
        animate: true,
        randomize: false,
        maxSimulationTime: 1500,
        nodeSpacing: function(node) { return 50; },
        edgeLength: function(edge) { return 100; }
    });
    
    layout.run();
    
    // Add click event for nodes with enhanced tooltips
    cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        const device = networkData.devices.find(d => d.name === node.id());
        if (device) {
            showDeviceDetails(device.name);
        }
    });
    
    // Add hover effects
    cy.on('mouseover', 'node', function(evt) {
        const node = evt.target;
        const connectedEdges = node.connectedEdges();
        const connectedNodes = connectedEdges.connectedNodes();
        
        // Highlight connected elements
        connectedEdges.style('line-color', '#4299e1');
        connectedNodes.style('border-color', '#4299e1');
    });
    
    cy.on('mouseout', 'node', function(evt) {
        // Reset styles
        cy.elements().removeStyle();
    });
    
    // Fit view after layout with delay
    setTimeout(() => {
        cy.fit();
        cy.zoom(cy.zoom() * 0.9); // Slight zoom out for better view
    }, 2100);
}
