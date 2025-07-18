// Global variables
let currentStaff = null;
let currentStaffRole = null;
let currentStatus = null;
let unsubscribeSnapshot = null;
let currentLocation = null;

// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

// DOM Elements
const staffSelect = document.getElementById('staffSelect');
const clockInBtn = document.getElementById('clockInBtn');
const clockOutBtn = document.getElementById('clockOutBtn');
const leaveRequestBtn = document.getElementById('leaveRequestBtn');
const statusDisplay = document.getElementById('statusDisplay');
const activityList = document.getElementById('activityList');
const currentTimeDisplay = document.getElementById('currentTime');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');
const locationStatus = document.getElementById('locationStatus');
const themeToggle = document.getElementById('themeToggle');
const clearActivityBtn = document.getElementById('clearActivityBtn');

// Leave request modal elements
const leaveModalOverlay = document.getElementById('leaveModalOverlay');
const closeLeaveModal = document.getElementById('closeLeaveModal');
const cancelLeaveRequest = document.getElementById('cancelLeaveRequest');
const submitLeaveRequest = document.getElementById('submitLeaveRequest');
const leaveRequestForm = document.getElementById('leaveRequestForm');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeApp();
});

// Theme Management Functions
function initializeTheme() {
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeToggle();
    
    // Add theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeToggle();
    
    // Add a subtle animation when switching themes
    document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

function updateThemeToggle() {
    const lightIcon = themeToggle?.querySelector('.theme-icon-light');
    const darkIcon = themeToggle?.querySelector('.theme-icon-dark');
    
    if (currentTheme === 'dark') {
        lightIcon?.classList.remove('active');
        darkIcon?.classList.add('active');
    } else {
        lightIcon?.classList.add('active');
        darkIcon?.classList.remove('active');
    }
}

function initializeApp() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
      // Event listeners
    staffSelect.addEventListener('change', handleStaffSelection);    clockInBtn.addEventListener('click', handleClockIn);
    clockOutBtn.addEventListener('click', handleClockOut);
    leaveRequestBtn.addEventListener('click', openLeaveRequestModal);
    clearActivityBtn.addEventListener('click', handleClearActivity);
    
    // Leave request modal listeners
    closeLeaveModal.addEventListener('click', closeLeaveRequestModal);
    cancelLeaveRequest.addEventListener('click', closeLeaveRequestModal);
    submitLeaveRequest.addEventListener('click', handleLeaveRequestSubmit);
    leaveModalOverlay.addEventListener('click', function(e) {
        if (e.target === leaveModalOverlay) closeLeaveRequestModal();
    });
      // Add ripple effect to buttons
    addRippleEffect();
    
    // Load recent activity    loadRecentActivity();
    
    // Request location permission on app start
    requestLocationPermission();
    
    // Set up periodic auto-clear check (every hour)
    setInterval(checkAndAutoCleanActivities, 60 * 60 * 1000);
    
    console.log('Shift Q initialized successfully!');
}

// Update current time display
function updateCurrentTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    currentTimeDisplay.textContent = now.toLocaleDateString('en-US', options);
}

// Handle staff selection
async function handleStaffSelection() {
    const selectedStaff = staffSelect.value;
    const selectedOption = staffSelect.options[staffSelect.selectedIndex];
    const staffRole = selectedOption.getAttribute('data-role');
    
    if (!selectedStaff) {
        currentStaff = null;
        currentStaffRole = null;
        updateButtonStates(false, false, false);
        updateStatusDisplay('info', 'Please select a staff member to continue');
        
        // Update task management state
        if (window.taskManager) {
            window.taskManager.updateTaskInputState();
        }
        return;
    }
    
    currentStaff = selectedStaff;
    currentStaffRole = staffRole;
    showLoading(true);
    
    try {
        // Check current status
        const status = await getCurrentStaffStatus(selectedStaff);
        currentStatus = status;
          if (status === 'clocked-in') {
            updateButtonStates(false, true, true);
            updateStatusDisplay('success', `${selectedStaff} is currently clocked in`, 'Click "Clock Out" when ready to leave');
        } else {
            updateButtonStates(true, false, true);
            updateStatusDisplay('info', `${selectedStaff} is ready to clock in`, 'Click "Clock In" to start your shift');
        }
        
        showToast('success', 'Staff Selected', `Welcome, ${selectedStaff}!`);
        
        // Update task management state
        if (window.taskManager) {
            window.taskManager.updateTaskInputState();
        }
        
    } catch (error) {
        console.error('Error checking staff status:', error);
        showToast('error', 'Error', 'Failed to check staff status. Please try again.');
        updateStatusDisplay('error', 'Error checking status', 'Please try selecting again');
    } finally {
        showLoading(false);
    }
}

// Get current staff status from Firebase
async function getCurrentStaffStatus(staffName) {
    if (!window.db || !window.firebaseUtils) {
        console.warn('Firebase not initialized, returning default status');
        return 'clocked-out';
    }
    
    try {
        const { collection, query, where, orderBy, limit, getDocs } = window.firebaseUtils;
        
        const q = query(
            collection(window.db, 'timeRecords'),
            where('staffName', '==', staffName),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return 'clocked-out';
        }
        
        const lastRecord = querySnapshot.docs[0].data();
        return lastRecord.action === 'clock-in' ? 'clocked-in' : 'clocked-out';
        
    } catch (error) {
        console.error('Error getting staff status:', error);
        return 'clocked-out';
    }
}

// Handle clock in
async function handleClockIn() {
    if (!currentStaff) return;
    
    showLoading(true);
    addButtonRipple(clockInBtn);
    
    try {
        // Get current location
        const location = await getCurrentLocation();
        
        const timestamp = new Date();
        const record = {
            staffName: currentStaff,
            action: 'clock-in',
            timestamp: window.db && window.firebaseUtils ? window.firebaseUtils.serverTimestamp() : timestamp,
            localTimestamp: timestamp.toISOString(),
            location: location
        };
        
        if (window.db && window.firebaseUtils) {
            const { collection, addDoc } = window.firebaseUtils;
            await addDoc(collection(window.db, 'timeRecords'), record);
        }
          currentStatus = 'clocked-in';
        updateButtonStates(false, true, true);
        updateStatusDisplay('success', `${currentStaff} clocked in successfully!`, 
            `Time: ${timestamp.toLocaleTimeString()}${location ? ` | Location: ${location.address || 'Coordinates captured'}` : ''}`);
        
        showToast('success', 'Clock In Successful', `Welcome to work, ${currentStaff}!${location ? ' Location recorded.' : ''}`);
        
        // Add to local activity (for demo purposes when Firebase is not configured)
        addLocalActivity(currentStaff, 'clock-in', timestamp, location);
        
    } catch (error) {
        console.error('Error clocking in:', error);
        if (error.message.includes('location')) {
            showToast('warning', 'Clock In Completed', 'Clocked in successfully, but location could not be captured.');
        } else {
            showToast('error', 'Clock In Failed', 'Please try again or contact support.');
        }
    } finally {
        showLoading(false);
    }
}

// Handle clock out
async function handleClockOut() {
    if (!currentStaff) return;
    
    showLoading(true);
    addButtonRipple(clockOutBtn);
    
    try {
        // Get current location
        const location = await getCurrentLocation();
          const timestamp = new Date();
        const record = {
            staffName: currentStaff,
            action: 'clock-out',
            timestamp: window.db && window.firebaseUtils ? window.firebaseUtils.serverTimestamp() : timestamp,
            localTimestamp: timestamp.toISOString(),
            location: location
        };
        
        if (window.db && window.firebaseUtils) {
            const { collection, addDoc } = window.firebaseUtils;
            await addDoc(collection(window.db, 'timeRecords'), record);
        }
          currentStatus = 'clocked-out';
        updateButtonStates(true, false, true);
        updateStatusDisplay('info', `${currentStaff} clocked out successfully!`, 
            `Time: ${timestamp.toLocaleTimeString()}${location ? ` | Location: ${location.address || 'Coordinates captured'}` : ''}`);
        
        showToast('success', 'Clock Out Successful', `Have a great day, ${currentStaff}!${location ? ' Location recorded.' : ''}`);
        
        // Add to local activity (for demo purposes when Firebase is not configured)
        addLocalActivity(currentStaff, 'clock-out', timestamp, location);
        
    } catch (error) {
        console.error('Error clocking out:', error);
        if (error.message.includes('location')) {
            showToast('warning', 'Clock Out Completed', 'Clocked out successfully, but location could not be captured.');
        } else {
            showToast('error', 'Clock Out Failed', 'Please try again or contact support.');
        }
    } finally {
        showLoading(false);
    }
}

// Update button states
function updateButtonStates(clockInEnabled, clockOutEnabled, leaveRequestEnabled = false) {
    clockInBtn.disabled = !clockInEnabled;
    clockOutBtn.disabled = !clockOutEnabled;
    leaveRequestBtn.disabled = !leaveRequestEnabled;
}

// Update status display
function updateStatusDisplay(type, message, subMessage = '') {
    statusDisplay.className = `status-display ${type}`;
    
    const iconMap = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle',
        'warning': 'fas fa-exclamation-circle'
    };
    
    statusDisplay.innerHTML = `
        <div class="status-icon">
            <i class="${iconMap[type]}"></i>
        </div>
        <div class="status-text">
            <p>${message}</p>
            ${subMessage ? `<small>${subMessage}</small>` : ''}
        </div>
    `;
}

// Load recent activity
function loadRecentActivity() {
    if (window.db && window.firebaseUtils) {
        // Real-time listener for Firebase
        const { collection, query, orderBy, limit, onSnapshot } = window.firebaseUtils;
        
        const q = query(
            collection(window.db, 'timeRecords'),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
        
        unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
            const activities = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    staffName: data.staffName,
                    action: data.action,
                    timestamp: data.timestamp?.toDate() || new Date(data.localTimestamp),
                    location: data.location
                });
            });
            displayActivities(activities);
        });
    } else {
        // Show demo data when Firebase is not configured
        displayActivities([]);
    }
}

// Display activities in the UI
function displayActivities(activities) {
    // Apply auto-clear logic
    const filteredActivities = checkAutoCleanActivity(activities);
    
    if (filteredActivities.length === 0) {
        activityList.innerHTML = `
            <div class="no-activity">
                <i class="fas fa-history"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = filteredActivities.map(activity => `
        <div class="activity-item ${activity.action}">
            <div class="activity-header">
                <span class="activity-name">${activity.staffName}</span>
                <span class="activity-action ${activity.action}">
                    ${activity.action === 'clock-in' ? 'Clocked In' : 'Clocked Out'}
                </span>
            </div>
            <div class="activity-time">
                ${activity.timestamp.toLocaleString()}
            </div>
            ${activity.location ? `
                <div class="activity-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${activity.location.address || `${activity.location.latitude.toFixed(4)}, ${activity.location.longitude.toFixed(4)}`}</span>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Add local activity (for demo purposes)
function addLocalActivity(staffName, action, timestamp, location = null, extra = null) {
    // Check if activities are manually cleared
    const clearTime = localStorage.getItem('activityClearTime');
    if (clearTime) {
        const timeSinceCleared = Date.now() - parseInt(clearTime);
        const twelveHoursInMs = 12 * 60 * 60 * 1000;
        
        // If less than 12 hours since manual clear, don't add activity to display
        if (timeSinceCleared < twelveHoursInMs) {
            return;
        }
    }
    
    const existingNoActivity = activityList.querySelector('.no-activity');
    if (existingNoActivity) {
        activityList.innerHTML = '';
    }
    
    const activityItem = document.createElement('div');
    activityItem.className = `activity-item ${action}`;
    
    let actionText = '';
    let extraInfo = '';
    
    switch(action) {
        case 'clock-in':
            actionText = 'Clocked In';
            break;
        case 'clock-out':
            actionText = 'Clocked Out';
            break;
        case 'leave-request':
            actionText = 'Leave Request';
            if (extra) {
                extraInfo = `
                    <div class="activity-extra">
                        <small><strong>${extra.type}</strong> • ${extra.duration}${extra.urgent ? ' • <span class="urgent">URGENT</span>' : ''}</small>
                    </div>
                `;
            }
            break;
    }
      activityItem.innerHTML = `
        <div class="activity-header">
            <div class="staff-info">
                <span class="activity-name">${staffName}</span>
                ${currentStaffRole ? `<span class="activity-role">${currentStaffRole}</span>` : ''}
            </div>
            <span class="activity-action ${action}">
                ${actionText}
            </span>
        </div>
        <div class="activity-time">
            ${timestamp.toLocaleString()}
        </div>
        ${location ? `
            <div class="activity-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}</span>
            </div>
        ` : ''}
        ${extraInfo}
    `;
    
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Keep only last 5 items for demo
    const items = activityList.querySelectorAll('.activity-item');
    if (items.length > 5) {
        items[items.length - 1].remove();
    }
}

// Show loading overlay
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('show');
    } else {
        loadingOverlay.classList.remove('show');
    }
}

// Show toast message
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-times-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-header">
            <i class="toast-icon ${iconMap[type]}"></i>
            <span class="toast-title">${title}</span>
        </div>
        <div class="toast-message">${message}</div>
        <div class="toast-progress"></div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Add ripple effect to buttons
function addRippleEffect() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.disabled) {
                addButtonRipple(this, e);
            }
        });
    });
}

// Add ripple animation to button
function addButtonRipple(button, event = null) {
    const ripple = button.querySelector('.btn-ripple');
    const rect = button.getBoundingClientRect();
    
    let x, y;
    if (event) {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    } else {
        x = rect.width / 2;
        y = rect.height / 2;
    }
    
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    ripple.style.animation = 'none';
    ripple.offsetHeight; // Trigger reflow
    ripple.style.animation = 'ripple 0.6s linear';
}

// Add slideOutRight animation for toast removal
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Leave Request Functions
function openLeaveRequestModal() {
    if (!currentStaff) {
        showToast('warning', 'Staff Selection Required', 'Please select your name first.');
        return;
    }
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
    
    leaveModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeLeaveRequestModal() {
    leaveModalOverlay.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Reset form
    leaveRequestForm.reset();
}

async function handleLeaveRequestSubmit(e) {
    e.preventDefault();
    
    if (!currentStaff) {
        showToast('error', 'Error', 'Please select a staff member first.');
        return;
    }
    
    // Get form data
    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('leaveReason').value;
    const urgent = document.getElementById('urgentRequest').checked;
    
    // Validate form
    if (!leaveType || !startDate || !endDate || !reason) {
        showToast('error', 'Validation Error', 'Please fill in all required fields.');
        return;
    }
    
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
        showToast('error', 'Date Error', 'End date must be after start date.');
        return;
    }
    
    showLoading(true);
    
    try {
        const timestamp = new Date();
        const leaveRequest = {
            staffName: currentStaff,
            leaveType: leaveType,
            startDate: startDate,
            endDate: endDate,
            reason: reason,
            urgent: urgent,
            status: 'pending',
            submittedAt: window.db && window.firebaseUtils ? window.firebaseUtils.serverTimestamp() : timestamp,
            localTimestamp: timestamp.toISOString()
        };
        
        // Save to Firebase if available
        if (window.db && window.firebaseUtils) {
            const { collection, addDoc } = window.firebaseUtils;
            await addDoc(collection(window.db, 'leaveRequests'), leaveRequest);
        }
        
        closeLeaveRequestModal();
        
        showToast('success', 'Leave Request Submitted', 
            `Your ${leaveType.toLowerCase()} request has been submitted for approval.${urgent ? ' Marked as urgent.' : ''}`);
        
        // Add to activity feed
        addLocalActivity(currentStaff, 'leave-request', timestamp, null, {
            type: leaveType,
            duration: `${startDate} to ${endDate}`,
            urgent: urgent
        });
        
    } catch (error) {
        console.error('Error submitting leave request:', error);
        showToast('error', 'Submission Failed', 'Failed to submit leave request. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Location-related functions
async function requestLocationPermission() {
    if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        updateLocationStatus(false, 'Location not supported');
        showToast('warning', 'Location Not Available', 'Your browser does not support location services.');
        return;
    }
    
    try {
        // Test if we can get location
        await getCurrentLocation();
        updateLocationStatus(true, 'Location tracking enabled');
        showToast('success', 'Location Access', 'Location services are ready for time tracking.');
    } catch (error) {
        console.warn('Location permission not granted:', error);
        updateLocationStatus(false, 'Location access pending');
        showToast('info', 'Location Permission', 'Location access will be requested when you clock in/out.');
    }
}

function updateLocationStatus(enabled, message) {
    if (locationStatus) {
        locationStatus.className = enabled ? 'location-status' : 'location-status disabled';
        locationStatus.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>${message}</span>
        `;
    }
}

async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout
            maximumAge: 300000 // 5 minutes
        };
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Try to get readable address using reverse geocoding
                    try {
                        const address = await reverseGeocode(location.latitude, location.longitude);
                        if (address) {
                            location.address = address;
                        }
                    } catch (geoError) {
                        console.warn('Could not get address:', geoError);
                        // Continue without address - coordinates are still valuable
                    }
                    
                    resolve(location);
                } catch (error) {
                    // Even if reverse geocoding fails, we still have coordinates
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    });
                }
            },
            (error) => {
                let errorMessage = 'Location access failed';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }
                console.warn('Geolocation error:', errorMessage);
                reject(new Error(errorMessage));
            },
            options
        );
    });
}

async function reverseGeocode(latitude, longitude) {
    try {
        // Using a free geocoding service (you might want to replace with your preferred service)
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        
        if (!response.ok) {
            throw new Error('Geocoding service unavailable');
        }
        
        const data = await response.json();
        
        // Format the address
        const parts = [];
        if (data.locality) parts.push(data.locality);
        if (data.principalSubdivision) parts.push(data.principalSubdivision);
        if (data.countryName) parts.push(data.countryName);
        
        return parts.length > 0 ? parts.join(', ') : null;
    } catch (error) {
        console.warn('Reverse geocoding failed:', error);
        return null;
    }
}

// Cleanup function
window.addEventListener('beforeunload', () => {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
    }
});

// Export functions for potential external use
window.TimeTracker = {
    getCurrentStaff: () => currentStaff,
    getCurrentStatus: () => currentStatus,
    showToast,
    showLoading
};

// Task Management System
class TaskManager {
    constructor() {
        this.tasks = [];
        this.taskCounter = 0;
        this.cleanupInterval = null;
        this.audioContext = null;
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeAudio();
        this.loadTasksFromStorage();
        this.startAutoCleanup();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.clearAllTasksBtn = document.getElementById('clearAllTasksBtn');
        this.taskList = document.getElementById('taskList');
    }    initializeEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.clearAllTasksBtn.addEventListener('click', () => this.clearAllTasks());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        this.taskInput.addEventListener('input', () => this.updateAddButton());
          // Initialize with disabled state
        this.updateTaskInputState();
    }

    initializeAudio() {
        // Initialize Web Audio API for notification sounds
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.audioContext = null;
        }
    }

    playNotificationSound() {
        if (!this.audioContext) return;

        try {
            // Resume audio context if suspended (required by browsers)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // Create a pleasant notification sound using oscillators
            const now = this.audioContext.currentTime;
            
            // First tone (higher pitch)
            const oscillator1 = this.audioContext.createOscillator();
            const gainNode1 = this.audioContext.createGain();
            
            oscillator1.connect(gainNode1);
            gainNode1.connect(this.audioContext.destination);
            
            oscillator1.type = 'sine';
            oscillator1.frequency.setValueAtTime(800, now);
            oscillator1.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            
            gainNode1.gain.setValueAtTime(0.3, now);
            gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            
            oscillator1.start(now);
            oscillator1.stop(now + 0.2);
            
            // Second tone (lower pitch, slightly delayed)
            setTimeout(() => {
                const oscillator2 = this.audioContext.createOscillator();
                const gainNode2 = this.audioContext.createGain();
                
                oscillator2.connect(gainNode2);
                gainNode2.connect(this.audioContext.destination);
                
                oscillator2.type = 'sine';
                oscillator2.frequency.setValueAtTime(600, this.audioContext.currentTime);
                oscillator2.frequency.exponentialRampToValueAtTime(450, this.audioContext.currentTime + 0.15);
                
                gainNode2.gain.setValueAtTime(0.25, this.audioContext.currentTime);
                gainNode2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);
                
                oscillator2.start();
                oscillator2.stop(this.audioContext.currentTime + 0.25);
            }, 80);
              } catch (error) {
            console.warn('Failed to play notification sound:', error);
        }
    }

    addButtonPulse() {
        // Add a visual pulse effect to the add button
        this.addTaskBtn.style.animation = 'none';
        setTimeout(() => {
            this.addTaskBtn.style.animation = 'buttonPulse 0.6s ease-out';
        }, 10);
        
        // Remove animation after it completes
        setTimeout(() => {
            this.addTaskBtn.style.animation = 'none';
        }, 600);
    }updateAddButton() {
        const hasContent = this.taskInput.value.trim().length > 0;
        const hasStaff = currentStaff !== null;
        const isEnabled = hasContent && hasStaff;
        
        this.addTaskBtn.style.opacity = isEnabled ? '1' : '0.4';
        this.addTaskBtn.style.transform = isEnabled ? 'scale(1)' : 'scale(0.95)';
        this.addTaskBtn.disabled = !isEnabled;
    }

    updateTaskInputState() {
        const hasStaff = currentStaff !== null;
        
        if (hasStaff) {
            this.taskInput.disabled = false;
            this.taskInput.placeholder = 'Add a quick task...';
            this.addTaskBtn.disabled = false;
            this.clearAllTasksBtn.disabled = false;
            this.taskInput.style.opacity = '1';
            this.addTaskBtn.style.opacity = '0.4'; // Will be updated by updateAddButton
            this.clearAllTasksBtn.style.opacity = '1';
        } else {
            this.taskInput.disabled = true;
            this.taskInput.placeholder = 'Select a staff member first to add tasks...';
            this.addTaskBtn.disabled = true;
            this.clearAllTasksBtn.disabled = true;
            this.taskInput.style.opacity = '0.5';
            this.addTaskBtn.style.opacity = '0.3';
            this.clearAllTasksBtn.style.opacity = '0.3';
        }
        
        this.updateAddButton();
    }    addTask() {
        // Check if staff member is selected
        if (!currentStaff) {
            showToast('warning', 'Staff Required', 'Please select a staff member first to add tasks');
            return;
        }

        const taskText = this.taskInput.value.trim();
        if (!taskText) return;

        const task = {
            id: ++this.taskCounter,
            text: taskText,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
            staffMember: currentStaff // Associate task with current staff member
        };        this.tasks.unshift(task); // Add to beginning of array
        this.taskInput.value = '';
        this.updateAddButton();
        this.renderTasks();
        this.saveTasksToStorage();
          // Play notification sound
        this.playNotificationSound();
        
        // Add visual feedback to the add button
        this.addButtonPulse();
        
        // Show success toast
        showToast('success', 'Task Added', `"${taskText.substring(0, 30)}${taskText.length > 30 ? '...' : ''}" added successfully`);
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const deletedTask = this.tasks.splice(taskIndex, 1)[0];
            this.renderTasks();
            this.saveTasksToStorage();
            showToast('info', 'Task Deleted', `"${deletedTask.text.substring(0, 30)}${deletedTask.text.length > 30 ? '...' : ''}" was removed`);
        }
    }    clearAllTasks() {
        // Check if staff member is selected
        if (!currentStaff) {
            showToast('warning', 'Staff Required', 'Please select a staff member first');
            return;
        }

        if (this.tasks.length === 0) {
            showToast('info', 'No Tasks', 'There are no tasks to clear');
            return;
        }

        const taskCount = this.tasks.length;
        this.tasks = [];
        this.renderTasks();
        this.saveTasksToStorage();
        showToast('success', 'Tasks Cleared', `${taskCount} task${taskCount === 1 ? '' : 's'} cleared successfully`);
    }    renderTasks() {
        if (this.tasks.length === 0) {
            const message = currentStaff 
                ? `No tasks yet. Add one above!`
                : `Select a staff member first to view and add tasks.`;
            
            this.taskList.innerHTML = `
                <div class="no-tasks">
                    <i class="fas fa-clipboard-list"></i>
                    <p>${message}</p>
                </div>
            `;
            return;
        }

        const now = new Date();
        this.taskList.innerHTML = this.tasks.map(task => {
            const isExpired = now > task.expiresAt;
            const timeLeft = this.getTimeRemaining(task.expiresAt);
            
            return `
                <div class="task-item ${isExpired ? 'task-expired' : ''}" data-task-id="${task.id}">
                    <div class="task-content">
                        <div>${task.text}</div>
                        <div class="task-time">
                            ${isExpired ? 'Expired' : timeLeft} • ${this.formatDate(task.createdAt)}
                            ${task.staffMember ? ` • ${task.staffMember}` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn-delete-task" onclick="taskManager.deleteTask(${task.id})" title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getTimeRemaining(expiresAt) {
        const now = new Date();
        const diff = expiresAt - now;
        
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m left`;
        } else {
            return `${minutes}m left`;
        }
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        
        return date.toLocaleDateString();
    }

    cleanupExpiredTasks() {
        const now = new Date();
        const initialCount = this.tasks.length;
        this.tasks = this.tasks.filter(task => now <= task.expiresAt);
        
        if (this.tasks.length < initialCount) {
            const removedCount = initialCount - this.tasks.length;
            this.renderTasks();
            this.saveTasksToStorage();
            if (removedCount > 0) {
                showToast('info', 'Auto Cleanup', `${removedCount} expired task${removedCount === 1 ? '' : 's'} automatically removed`);
            }
        }
    }

    startAutoCleanup() {
        // Clean up expired tasks every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredTasks();
        }, 5 * 60 * 1000);
        
        // Also update the display every minute to show updated time remaining
        setInterval(() => {
            if (this.tasks.length > 0) {
                this.renderTasks();
            }
        }, 60 * 1000);
    }

    saveTasksToStorage() {
        try {
            const tasksData = {
                tasks: this.tasks,
                counter: this.taskCounter
            };
            localStorage.setItem('shiftq_tasks', JSON.stringify(tasksData));
        } catch (error) {
            console.warn('Failed to save tasks to storage:', error);
        }
    }

    loadTasksFromStorage() {
        try {
            const savedData = localStorage.getItem('shiftq_tasks');
            if (savedData) {
                const tasksData = JSON.parse(savedData);
                this.tasks = tasksData.tasks.map(task => ({
                    ...task,
                    createdAt: new Date(task.createdAt),
                    expiresAt: new Date(task.expiresAt)
                }));
                this.taskCounter = tasksData.counter || 0;
                
                // Clean up any expired tasks on load
                this.cleanupExpiredTasks();
                this.renderTasks();
            }
        } catch (error) {
            console.warn('Failed to load tasks from storage:', error);
            this.tasks = [];
            this.taskCounter = 0;
        }
    }
}

// Initialize task manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure all other elements are initialized first
    setTimeout(() => {
        window.taskManager = new TaskManager();
    }, 100);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
    }
    if (window.taskManager && window.taskManager.cleanupInterval) {
        clearInterval(window.taskManager.cleanupInterval);
    }
});

// Handle clear activity button
function handleClearActivity() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to clear the recent activity display? This will only clear the display, not the backend data.')) {
        clearActivityDisplay();
        showToast('Recent activity display cleared', 'success');
    }
}

// Clear activity display
function clearActivityDisplay() {
    // Clear the display
    activityList.innerHTML = `
        <div class="no-activity">
            <i class="fas fa-history"></i>
            <p>No recent activity</p>
        </div>
    `;
    
    // Store clear timestamp in localStorage for auto-clear functionality
    localStorage.setItem('activityClearTime', Date.now().toString());
}

// Check if activities should be auto-cleared (12 hours)
function checkAutoCleanActivity(activities) {
    const clearTime = localStorage.getItem('activityClearTime');
    const twelveHoursInMs = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    
    if (clearTime) {
        const timeSinceCleared = Date.now() - parseInt(clearTime);
        
        // If less than 12 hours since manual clear, don't show activities
        if (timeSinceCleared < twelveHoursInMs) {
            return [];
        } else {
            // Remove the clear timestamp as 12 hours have passed
            localStorage.removeItem('activityClearTime');
        }
    }
    
    // Filter activities older than 12 hours for auto-clear
    const twelveHoursAgo = new Date(Date.now() - twelveHoursInMs);
    return activities.filter(activity => {
        const activityTime = activity.timestamp;
        return activityTime && activityTime > twelveHoursAgo;
    });
}

// Periodic check for auto-clearing activities
function checkAndAutoCleanActivities() {
    const clearTime = localStorage.getItem('activityClearTime');
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    
    if (clearTime) {
        const timeSinceCleared = Date.now() - parseInt(clearTime);
        
        // If 12 hours have passed since manual clear, reload activities
        if (timeSinceCleared >= twelveHoursInMs) {
            localStorage.removeItem('activityClearTime');
            loadRecentActivity(); // Reload activities
        }
    }
}
