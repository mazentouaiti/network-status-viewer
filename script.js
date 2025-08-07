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

// Tab elements
const deviceTabCount = document.getElementById('deviceTabCount');
const connectionTabCount = document.getElementById('connectionTabCount');

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

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Clear data button
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearData);
    }

    // Search functionality
    if (deviceSearch) {
        deviceSearch.addEventListener('input', handleDeviceSearch);
    }

    if (connectionSearch) {
        connectionSearch.addEventListener('input', handleConnectionSearch);
    }

    // Network controls
    const fitViewBtn = document.getElementById('fitViewBtn');
    const centerBtn = document.getElementById('centerBtn');
    const layoutBtn = document.getElementById('layoutBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    if (fitViewBtn) fitViewBtn.addEventListener('click', fitNetwork);
    if (centerBtn) centerBtn.addEventListener('click', centerNetwork);
    if (layoutBtn) layoutBtn.addEventListener('click', relayoutNetwork);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Export buttons
    const exportDevicesBtn = document.getElementById('exportDevicesBtn');
    const exportConnectionsBtn = document.getElementById('exportConnectionsBtn');

    if (exportDevicesBtn) exportDevicesBtn.addEventListener('click', exportDevicesCSV);
    if (exportConnectionsBtn) exportConnectionsBtn.addEventListener('click', exportConnectionsCSV);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragOver(e) {
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    uploadArea.classList.remove('dragover');
}

function handleFileDrop(e) {
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

async function processFile(file) {
    console.log('Processing file:', file.name);
    
    // Show loading state
    showLoading(`Processing ${file.name}...`);
    
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Upload response:', data);
        
        networkData = data;
        updateUI(data);
        updateNetworkVisualization(data);
        
        // Hide empty state and show results
        if (emptyState) emptyState.style.display = 'none';
        resultsSection.style.display = 'block';
        clearDataBtn.style.display = 'inline-block';
        
        showSuccess('Network topology parsed successfully!');
        
    } catch (error) {
        console.error('Error processing file:', error);
        showError(`Error processing file: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function showLoading(message) {
    uploadContent.style.display = 'none';
    loadingContent.style.display = 'block';
    updateProgress(30);
    
    setTimeout(() => updateProgress(60), 500);
    setTimeout(() => updateProgress(90), 1000);
}

function hideLoading() {
    uploadContent.style.display = 'block';
    loadingContent.style.display = 'none';
    updateProgress(0);
}

function updateProgress(percentage) {
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
}

function showSuccess(message) {
    showMessage(message, 'success');
}

function showError(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    if (!messageArea) return;
    
    const alertClass = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800';
    const iconPath = type === 'success' 
        ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
    
    messageArea.innerHTML = `
        <div class="${alertClass} border rounded-lg p-4 flex items-center fade-in">
            <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" />
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        if (messageArea) messageArea.innerHTML = '';
    }, 5000);
}

function updateUI(data) {
    const devices = data.devices || [];
    const links = data.links || [];
    
    // Update main stats
    deviceCount.textContent = devices.length;
    connectionCount.textContent = links.length;
    
    // Update tab counters
    if (deviceTabCount) deviceTabCount.textContent = `${devices.length} devices`;
    if (connectionTabCount) connectionTabCount.textContent = `${links.length} connections`;
    
    // Calculate network health (simple metric)
    const healthScore = devices.length > 0 ? Math.min(100, (links.length / devices.length) * 50 + 50) : 0;
    networkHealth.textContent = `${Math.round(healthScore)}%`;
    
    // Store for filtering
    filteredDevices = [...devices];
    filteredConnections = [...links];
    
    // Update tables
    updateDevicesTable(devices);
    updateConnectionsTable(links);
    
    // Update analytics
    updateAnalytics(data);
    
    // Show overview tab by default
    showTab('overview');
}

function updateDevicesTable(devices) {
    if (!devicesTableBody) return;
    
    devicesTableBody.innerHTML = '';
    
    devices.forEach((device, index) => {
        const row = document.createElement('tr');
        row.className = 'table-row hover:bg-gray-50 transition-all duration-200';
        
        const deviceIcon = getDeviceIcon(device.type);
        const deviceColor = getDeviceColor(device.type);
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full ${deviceColor} flex items-center justify-center mr-3">
                        <span class="text-white text-xs font-bold">${deviceIcon}</span>
                    </div>
                    <div class="text-sm font-medium text-gray-900">${device.name}</div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeviceTypeBadge(device.type)}">
                    ${device.type}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${device.ip || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    Active
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="highlightDevice('${device.name}')" class="text-blue-600 hover:text-blue-900 mr-2">Highlight</button>
                <button onclick="showDeviceDetails('${device.name}')" class="text-gray-600 hover:text-gray-900">Details</button>
            </td>
        `;
        
        devicesTableBody.appendChild(row);
    });
}

function updateConnectionsTable(connections) {
    if (!connectionsTableBody) return;
    
    connectionsTableBody.innerHTML = '';
    
    connections.forEach((connection, index) => {
        const row = document.createElement('tr');
        row.className = 'table-row hover:bg-gray-50 transition-all duration-200';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${connection.from}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${connection.to}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ${connection.type || 'Ethernet'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    Connected
                </span>
            </td>
        `;
        
        connectionsTableBody.appendChild(row);
    });
}

function getDeviceIcon(type) {
    const iconMap = {
        'Router': '🔄',
        'Switch': '⚡',
        'PC': '💻',
        'Server': '🖥️',
        'Firewall': '🛡️',
        'Hub': '🔗',
        'Bridge': '🌉'
    };
    return iconMap[type] || '❓';
}

function getDeviceColor(type) {
    const colorMap = {
        'Router': 'bg-red-500',
        'Switch': 'bg-blue-500',
        'PC': 'bg-green-500',
        'Server': 'bg-purple-500',
        'Firewall': 'bg-red-600',
        'Hub': 'bg-gray-500',
        'Bridge': 'bg-gray-600'
    };
    return colorMap[type] || 'bg-gray-400';
}

function getDeviceTypeBadge(type) {
    const badgeMap = {
        'Router': 'bg-red-100 text-red-800',
        'Switch': 'bg-blue-100 text-blue-800',
        'PC': 'bg-green-100 text-green-800',
        'Server': 'bg-purple-100 text-purple-800',
        'Firewall': 'bg-red-100 text-red-800',
        'Hub': 'bg-gray-100 text-gray-800',
        'Bridge': 'bg-gray-100 text-gray-800'
    };
    return badgeMap[type] || 'bg-gray-100 text-gray-800';
}

// Search functionality
function handleDeviceSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredDevices = networkData.devices.filter(device => 
        device.name.toLowerCase().includes(searchTerm) ||
        device.type.toLowerCase().includes(searchTerm) ||
        (device.ip && device.ip.toLowerCase().includes(searchTerm))
    );
    updateDevicesTable(filteredDevices);
}

function handleConnectionSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredConnections = networkData.links.filter(connection => 
        connection.from.toLowerCase().includes(searchTerm) ||
        connection.to.toLowerCase().includes(searchTerm)
    );
    updateConnectionsTable(filteredConnections);
}

// Network control functions
function fitNetwork() {
    if (cy) {
        cy.fit();
        cy.center();
    }
}

function centerNetwork() {
    if (cy) {
        cy.center();
    }
}

function relayoutNetwork() {
    if (cy && networkData) {
        applyLayout();
    }
}

function toggleFullscreen() {
    const cyContainer = document.getElementById('cy');
    if (!document.fullscreenElement) {
        cyContainer.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Device interaction functions
function highlightDevice(deviceName) {
    if (cy) {
        cy.elements().removeClass('highlighted');
        const node = cy.getElementById(deviceName);
        if (node.length > 0) {
            node.addClass('highlighted');
            cy.center(node);
            cy.fit(node, 100);
        }
    }
}

function showDeviceDetails(deviceName) {
    const device = networkData.devices.find(d => d.name === deviceName);
    if (device) {
        alert(`Device: ${device.name}\nType: ${device.type}\nIP: ${device.ip || 'N/A'}`);
    }
}

// Dark mode functionality
function checkDarkModePreference() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        enableDarkMode();
    }
}

function toggleDarkMode() {
    if (isDarkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    isDarkMode = true;
    localStorage.setItem('darkMode', 'true');
    if (darkModeToggle) {
        darkModeToggle.textContent = '☀️ Light Mode';
    }
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    isDarkMode = false;
    localStorage.setItem('darkMode', 'false');
    if (darkModeToggle) {
        darkModeToggle.textContent = '🌙 Dark Mode';
    }
}

// Export functionality
function exportDevicesCSV() {
    const devices = filteredDevices || [];
    let csv = 'Device Name,Type,IP Address,Status\n';
    devices.forEach(device => {
        csv += `"${device.name}","${device.type}","${device.ip || 'N/A'}","Active"\n`;
    });
    downloadCSV(csv, 'network_devices.csv');
}

function exportConnectionsCSV() {
    const connections = filteredConnections || [];
    let csv = 'From Device,To Device,Connection Type,Status\n';
    connections.forEach(connection => {
        csv += `"${connection.from}","${connection.to}","${connection.type || 'Ethernet'}","Connected"\n`;
    });
    downloadCSV(csv, 'network_connections.csv');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Clear data function
function clearData() {
    networkData = null;
    filteredDevices = [];
    filteredConnections = [];
    
    // Reset UI
    deviceCount.textContent = '0';
    connectionCount.textContent = '0';
    networkHealth.textContent = '--';
    
    // Reset tab counters
    if (deviceTabCount) deviceTabCount.textContent = '0 devices';
    if (connectionTabCount) connectionTabCount.textContent = '0 connections';
    
    if (devicesTableBody) devicesTableBody.innerHTML = '';
    if (connectionsTableBody) connectionsTableBody.innerHTML = '';
    if (cy) cy.elements().remove();
    
    // Reset analytics
    const connectivityElement = document.getElementById('connectivityScore');
    const diversityElement = document.getElementById('deviceDiversity');
    const densityElement = document.getElementById('networkDensity');
    const distributionElement = document.getElementById('deviceDistribution');
    const insightsElement = document.getElementById('networkInsights');
    
    if (connectivityElement) connectivityElement.textContent = '--';
    if (diversityElement) diversityElement.textContent = '--';
    if (densityElement) densityElement.textContent = '--';
    if (distributionElement) distributionElement.innerHTML = '';
    if (insightsElement) insightsElement.innerHTML = '';
    
    // Hide results and show empty state
    resultsSection.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    clearDataBtn.style.display = 'none';
    
    // Clear search inputs
    if (deviceSearch) deviceSearch.value = '';
    if (connectionSearch) connectionSearch.value = '';
    
    // Clear message area
    if (messageArea) messageArea.innerHTML = '';
}

function initializeCytoscape() {
    console.log('Initializing Cytoscape...');
    
    try {
        cy = cytoscape({
            container: document.getElementById('cy'),
            
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'text-valign': 'bottom',
                        'text-halign': 'center',
                        'text-margin-y': 10,
                        'background-color': 'data(color)',
                        'border-width': 3,
                        'border-color': 'data(borderColor)',
                        'width': 60,
                        'height': 60,
                        'font-size': 12,
                        'font-weight': 'bold',
                        'color': '#2d3748',
                        'text-background-color': 'white',
                        'text-background-opacity': 0.8,
                        'text-background-padding': 3,
                        'text-background-shape': 'roundrectangle'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 4,
                        'line-color': '#4299e1',
                        'target-arrow-color': '#4299e1',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'arrow-scale': 1.5
                    }
                },
                {
                    selector: 'node:selected',
                    style: {
                        'border-width': 6,
                        'border-color': '#3182ce'
                    }
                },
                {
                    selector: 'edge:selected',
                    style: {
                        'width': 6,
                        'line-color': '#3182ce'
                    }
                }
            ],
            
            layout: {
                name: 'grid'
            }
        });
        
        console.log('Cytoscape initialized successfully');
        
    } catch (error) {
        console.error('Error initializing Cytoscape:', error);
    }
}

function updateNetworkVisualization(data) {
    console.log('Updating network visualization with data:', data);
    
    if (!cy) {
        console.error('Cytoscape not initialized');
        return;
    }
    
    try {
        const devices = data.devices || [];
        const links = data.links || [];
        
        console.log(`Processing ${devices.length} devices and ${links.length} links`);
        
        // Clear existing elements
        cy.elements().remove();
        
        // Add nodes
        devices.forEach(device => {
            const color = getNodeColor(device.type);
            const borderColor = getNodeBorderColor(device.type);
            
            cy.add({
                group: 'nodes',
                data: {
                    id: device.name,
                    label: `${device.name}\n${device.type}\n${device.ip || ''}`,
                    type: device.type,
                    ip: device.ip || '',
                    color: color,
                    borderColor: borderColor
                }
            });
            
            console.log(`Added node: ${device.name} (${device.type})`);
        });
        
        // Add edges
        links.forEach(link => {
            const edgeId = `${link.from}-${link.to}`;
            cy.add({
                group: 'edges',
                data: {
                    id: edgeId,
                    source: link.from,
                    target: link.to
                }
            });
            
            console.log(`Added edge: ${link.from} -> ${link.to}`);
        });
        
        // Apply layout
        applyLayout();
        
        console.log('Network visualization updated successfully');
        
    } catch (error) {
        console.error('Error updating network visualization:', error);
    }
}

function getNodeColor(deviceType) {
    const colorMap = {
        'Router': '#fed7d7',
        'Switch': '#bee3f8',
        'PC': '#c6f6d5',
        'Server': '#fbb6ce',
        'Firewall': '#fed7d7',
        'Hub': '#e2e8f0',
        'Bridge': '#e2e8f0'
    };
    return colorMap[deviceType] || '#e2e8f0';
}

function getNodeBorderColor(deviceType) {
    const colorMap = {
        'Router': '#c53030',
        'Switch': '#2b6cb0',
        'PC': '#2f855a',
        'Server': '#b83280',
        'Firewall': '#c53030',
        'Hub': '#4a5568',
        'Bridge': '#4a5568'
    };
    return colorMap[deviceType] || '#4a5568';
}

function applyLayout() {
    console.log('Applying layout...');
    
    try {
        if (typeof cytoscape !== 'undefined' && cy.elements().length > 0) {
            // Try cola layout first (if available)
            if (cy.layout && typeof cy.cola === 'function') {
                console.log('Using cola layout');
                cy.layout({
                    name: 'cola',
                    animate: true,
                    refresh: 1,
                    maxSimulationTime: 4000,
                    ungrabifyWhileSimulating: false,
                    fit: true,
                    padding: 30,
                    nodeSpacing: function(node) { return 10; },
                    edgeLength: function(edge) { return 100; },
                    infinite: false
                }).run();
            } else {
                console.log('Using grid layout (fallback)');
                cy.layout({
                    name: 'grid',
                    fit: true,
                    padding: 30,
                    avoidOverlap: true,
                    rows: undefined,
                    cols: undefined
                }).run();
            }
            
            // Fit the graph to the container
            setTimeout(() => {
                cy.fit();
                cy.center();
            }, 1000);
        }
    } catch (error) {
        console.error('Error applying layout:', error);
    }
}

console.log('Script loaded successfully');

// Tab Navigation Functions
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all sidebar tabs
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    sidebarTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
        selectedTab.classList.add('fade-in');
    }
    
    // Add active class to selected sidebar tab
    const selectedSidebarTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedSidebarTab) {
        selectedSidebarTab.classList.add('active');
    }
    
    console.log('Switched to tab:', tabName);
}

// Analytics Functions
function updateAnalytics(data) {
    const devices = data.devices || [];
    const links = data.links || [];
    
    // Calculate connectivity score
    const connectivityScore = devices.length > 0 ? Math.min(100, (links.length / devices.length) * 40 + 60) : 0;
    const connectivityElement = document.getElementById('connectivityScore');
    if (connectivityElement) {
        connectivityElement.textContent = Math.round(connectivityScore) + '%';
    }
    
    // Calculate device diversity
    const deviceTypes = [...new Set(devices.map(d => d.type))];
    const diversityScore = deviceTypes.length;
    const diversityElement = document.getElementById('deviceDiversity');
    if (diversityElement) {
        diversityElement.textContent = diversityScore + ' types';
    }
    
    // Calculate network density
    const maxPossibleConnections = devices.length * (devices.length - 1) / 2;
    const density = maxPossibleConnections > 0 ? (links.length / maxPossibleConnections) * 100 : 0;
    const densityElement = document.getElementById('networkDensity');
    if (densityElement) {
        densityElement.textContent = Math.round(density) + '%';
    }
    
    // Update device distribution
    updateDeviceDistribution(devices);
    
    // Update network insights
    updateNetworkInsights(devices, links);
}

function updateDeviceDistribution(devices) {
    const distribution = {};
    devices.forEach(device => {
        distribution[device.type] = (distribution[device.type] || 0) + 1;
    });
    
    const distributionElement = document.getElementById('deviceDistribution');
    if (distributionElement) {
        distributionElement.innerHTML = '';
        
        Object.entries(distribution).forEach(([type, count]) => {
            const percentage = ((count / devices.length) * 100).toFixed(1);
            const color = getDeviceColor(type);
            
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center p-3 rounded-lg bg-gray-50';
            item.innerHTML = `
                <div class="flex items-center">
                    <div class="w-4 h-4 rounded ${color} mr-3"></div>
                    <span class="font-medium">${type}</span>
                </div>
                <div class="text-right">
                    <div class="font-bold">${count}</div>
                    <div class="text-xs text-gray-500">${percentage}%</div>
                </div>
            `;
            distributionElement.appendChild(item);
        });
    }
}

function updateNetworkInsights(devices, links) {
    const insights = [];
    
    // Basic insights
    if (devices.length === 0) {
        insights.push({ type: 'info', message: 'No devices found in the network.' });
    } else {
        insights.push({ type: 'success', message: `Network contains ${devices.length} devices and ${links.length} connections.` });
    }
    
    // Router analysis
    const routers = devices.filter(d => d.type === 'Router');
    if (routers.length === 0) {
        insights.push({ type: 'warning', message: 'No routers detected. This may limit inter-network communication.' });
    } else if (routers.length === 1) {
        insights.push({ type: 'info', message: 'Single router topology detected - good for small networks.' });
    } else {
        insights.push({ type: 'success', message: `${routers.length} routers provide redundant routing paths.` });
    }
    
    // Connectivity analysis
    const avgConnections = devices.length > 0 ? links.length / devices.length : 0;
    if (avgConnections < 1) {
        insights.push({ type: 'error', message: 'Low connectivity - some devices may be isolated.' });
    } else if (avgConnections > 2) {
        insights.push({ type: 'success', message: 'High connectivity provides good network resilience.' });
    }
    
    // Device diversity
    const deviceTypes = [...new Set(devices.map(d => d.type))];
    if (deviceTypes.length >= 3) {
        insights.push({ type: 'success', message: `Diverse network with ${deviceTypes.length} different device types.` });
    }
    
    const insightsElement = document.getElementById('networkInsights');
    if (insightsElement) {
        insightsElement.innerHTML = '';
        
        insights.forEach(insight => {
            const icon = insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : insight.type === 'error' ? '❌' : 'ℹ️';
            const colorClass = insight.type === 'success' ? 'text-green-700 bg-green-50' : 
                              insight.type === 'warning' ? 'text-yellow-700 bg-yellow-50' : 
                              insight.type === 'error' ? 'text-red-700 bg-red-50' : 'text-blue-700 bg-blue-50';
            
            const item = document.createElement('div');
            item.className = `flex items-center p-3 rounded-lg ${colorClass}`;
            item.innerHTML = `
                <span class="mr-3">${icon}</span>
                <span class="text-sm">${insight.message}</span>
            `;
            insightsElement.appendChild(item);
        });
    }
}