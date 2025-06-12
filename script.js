// Global variables
let currentStaff = null;
let currentStatus = null;
let unsubscribeSnapshot = null;
let currentLocation = null;

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

// Leave request modal elements
const leaveModalOverlay = document.getElementById('leaveModalOverlay');
const closeLeaveModal = document.getElementById('closeLeaveModal');
const cancelLeaveRequest = document.getElementById('cancelLeaveRequest');
const submitLeaveRequest = document.getElementById('submitLeaveRequest');
const leaveRequestForm = document.getElementById('leaveRequestForm');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
      // Event listeners
    staffSelect.addEventListener('change', handleStaffSelection);
    clockInBtn.addEventListener('click', handleClockIn);
    clockOutBtn.addEventListener('click', handleClockOut);
    leaveRequestBtn.addEventListener('click', openLeaveRequestModal);
    
    // Leave request modal listeners
    closeLeaveModal.addEventListener('click', closeLeaveRequestModal);
    cancelLeaveRequest.addEventListener('click', closeLeaveRequestModal);
    submitLeaveRequest.addEventListener('click', handleLeaveRequestSubmit);
    leaveModalOverlay.addEventListener('click', function(e) {
        if (e.target === leaveModalOverlay) closeLeaveRequestModal();
    });
      // Add ripple effect to buttons
    addRippleEffect();
    
    // Load recent activity
    loadRecentActivity();
    
    // Request location permission on app start
    requestLocationPermission();
    
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
    
    if (!selectedStaff) {        currentStaff = null;
        updateButtonStates(false, false, false);
        updateStatusDisplay('info', 'Please select a staff member to continue');
        return;
    }
    
    currentStaff = selectedStaff;
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
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="no-activity">
                <i class="fas fa-history"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = activities.map(activity => `
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
            <span class="activity-name">${staffName}</span>
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
