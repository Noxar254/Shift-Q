// Global variables
let currentShiftId = null;
let userLatitude = null;
let userLongitude = null;
let isClockedIn = false;
let userShifts = [];
let allStaffMembers = [];
let checkStaffInterval = null;

// Global variables for branch and role storage
let allBranches = {};
let allRoles = {};

// DOM Elements
const clockBtn = document.getElementById('clock-btn');
const leaveBtn = document.getElementById('leave-btn');
const swapShiftBtn = document.getElementById('swap-shift-btn');
const leaveModal = document.getElementById('leave-modal');
const shiftChangeModal = document.getElementById('shift-change-modal');
const closeModal = document.querySelectorAll('.close-modal');
const submitLeaveBtn = document.getElementById('submit-leave');
const submitSwapBtn = document.getElementById('submit-swap');
const branchSelect = document.getElementById('branch');
const roleSelect = document.getElementById('role');
const locationStatus = document.getElementById('location-status');
const staffSelect = document.getElementById('staff'); // Staff dropdown
const myShiftSelect = document.getElementById('my-shift'); // My shift dropdown
const swapWithStaffSelect = document.getElementById('swap-with-staff'); // Staff to swap with dropdown

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get geolocation
    getLocation();
    
    // Load staff list
    loadStaffList();
    
    // Load branch and role data
    loadBranches();
    loadRoles();
    
    // Add staff selection handler if dropdown exists
    if (staffSelect) {
        staffSelect.addEventListener('change', handleStaffSelection);
    }
    
    // Check clock in status
    checkClockInStatus();
    
    // Event listeners
    clockBtn.addEventListener('click', handleClockAction);
    leaveBtn.addEventListener('click', openLeaveModal);
    
    // Debug the swap shift button
    console.log("Swap shift button exists:", swapShiftBtn !== null);
    if (swapShiftBtn) {
        swapShiftBtn.addEventListener('click', openShiftChangeModal);
        console.log("Added event listener to swap shift button");
    } else {
        console.error("Swap shift button not found in the DOM");
    }
    
    closeModal.forEach(btn => btn.addEventListener('click', closeModals));
    submitLeaveBtn.addEventListener('click', submitLeaveRequest);
    submitSwapBtn && submitSwapBtn.addEventListener('click', submitShiftChangeRequest);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === leaveModal || e.target === shiftChangeModal) {
            closeModals();
        }
    });

    // Create animated particles for buttons
    animateCircleButtons();
    
    // Setup admin button
    setupAdminButton();
    
    // Setup periodic staff list check every 30 seconds to detect new staff members
    checkStaffInterval = setInterval(checkForStaffUpdates, 30000);
    
    // Setup event listener for real-time branch and role updates
    setupRealtimeUpdates();
    
    // Initialize chat elements
    const chatBtn = document.getElementById('chat-btn');
    const chatModal = document.getElementById('chat-modal');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatNotification = document.getElementById('chat-notification');
    const toggleMembersBtn = document.getElementById('toggle-members-btn');
    const chatMembers = document.getElementById('chat-members');
    const membersList = document.getElementById('members-list');

    // Initialize chat functionality
    initializeChat();

    function initializeChat() {
        if (!chatBtn || !chatModal) return;
        
        chatBtn.addEventListener('click', function() {
            chatModal.style.display = 'flex';
            chatNotification.style.display = 'none';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        closeChatBtn.addEventListener('click', function() {
            chatModal.style.display = 'none';
        });

        sendChatBtn.addEventListener('click', sendMessage);
        
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        toggleMembersBtn.addEventListener('click', function() {
            chatMembers.classList.toggle('active');
            this.innerHTML = chatMembers.classList.contains('active') 
                ? 'Hide Team Members <i class="fas fa-chevron-up"></i>' 
                : 'Show Team Members <i class="fas fa-chevron-down"></i>';
        });
        
        // Load chat history from local storage
        loadChatHistory();
        
        // Load team members
        loadTeamMembers();
        
        // Set up polling for new messages
        setInterval(checkForNewMessages, 5000); // Check every 5 seconds
        
        // Add seed messages if the chat is empty
        addSeedMessagesIfEmpty();
    }

    // Add seed messages if this is a fresh chat
    function addSeedMessagesIfEmpty() {
        const messages = JSON.parse(localStorage.getItem('teamChatMessages') || '[]');
        
        if (messages.length === 0) {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            
            const seedMessages = [
                {
                    type: 'received',
                    text: 'Welcome to the Shift Q Team Chat! 👋',
                    sender: 'Manager',
                    timestamp: yesterday.toISOString(),
                    userId: 'manager1'
                },
                {
                    type: 'received',
                    text: 'This is where we can all communicate about shifts, leave requests, and general team updates.',
                    sender: 'Manager',
                    timestamp: yesterday.toISOString(),
                    userId: 'manager1' 
                },
                {
                    type: 'received',
                    text: 'Hey everyone! Looking forward to working with you all!',
                    sender: 'John Doe',
                    timestamp: yesterday.toISOString(),
                    userId: 'john'
                },
                {
                    type: 'received',
                    text: 'Good morning team, I\'ll be at the downtown branch today if anyone needs help.',
                    sender: 'Jane Smith',
                    timestamp: now.toISOString(),
                    userId: 'jane'
                }
            ];
            
            localStorage.setItem('teamChatMessages', JSON.stringify(seedMessages));
            loadChatHistory();
        }
    }

    // Send a chat message
    function sendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;
        
        // Get current user's name from the staff dropdown
        const staffSelect = document.getElementById('staff');
        let userName = 'You';
        let userId = 'anonymous';
        
        if (staffSelect && staffSelect.selectedIndex > 0) {
            userName = staffSelect.options[staffSelect.selectedIndex].text;
            userId = staffSelect.value;
        }
        
        // Create message element
        addMessageToChat('sent', messageText, userName);
        
        // Store in local storage for persistence with the current user ID
        storeChatMessage('sent', messageText, userName, userId);
        
        // Clear input
        chatInput.value = '';
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add message to chat display
    function addMessageToChat(type, text, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageElement.innerHTML = `
            <div class="message-bubble">${text}</div>
            <div class="message-info">${type === 'sent' ? 'You' : `<span class="online-status"></span> ${sender}`} • ${time}</div>
        `;
        
        chatMessages.appendChild(messageElement);
    }

    // Store chat message in local storage
    function storeChatMessage(type, text, sender, userId) {
        // Get existing messages
        let messages = JSON.parse(localStorage.getItem('teamChatMessages') || '[]');
        
        // Add new message
        messages.push({
            type: type,
            text: text,
            sender: sender,
            userId: userId || 'anonymous',
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 messages
        if (messages.length > 100) {
            messages = messages.slice(messages.length - 100);
        }
        
        // Store back in localStorage
        localStorage.setItem('teamChatMessages', JSON.stringify(messages));
    }

    // Load chat history from local storage
    function loadChatHistory() {
        const messages = JSON.parse(localStorage.getItem('teamChatMessages') || '[]');
        
        if (messages.length > 0) {
            chatMessages.innerHTML = '';
            
            // Get current user ID from the staff dropdown
            const staffSelect = document.getElementById('staff');
            const currentUserId = staffSelect && staffSelect.value ? staffSelect.value : 'anonymous';
            
            messages.forEach(msg => {
                const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                // Determine if this message is from the current user
                const isCurrentUser = msg.userId === currentUserId;
                const messageType = isCurrentUser ? 'sent' : 'received';
                
                const messageElement = document.createElement('div');
                messageElement.className = `message ${messageType}`;
                
                messageElement.innerHTML = `
                    <div class="message-bubble">${msg.text}</div>
                    <div class="message-info">${isCurrentUser ? 'You' : `<span class="online-status"></span> ${msg.sender}`} • ${time}</div>
                `;
                
                chatMessages.appendChild(messageElement);
            });
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Update unread count for notification badge
            updateUnreadCount(messages);
        }
    }

    // Check for new messages that may have been added by other users
    function checkForNewMessages() {
        // This is a simulation of checking for new messages
        // In a real app, you'd use WebSockets or server polling
        
        // For this demo, we'll just check if there are any new messages in localStorage
        // that we haven't seen yet
        const lastCheckedTime = localStorage.getItem('lastChatCheckTime') || '0';
        const messages = JSON.parse(localStorage.getItem('teamChatMessages') || '[]');
        
        // Find any messages newer than our last check time
        const newMessages = messages.filter(msg => 
            new Date(msg.timestamp) > new Date(lastCheckedTime)
        );
        
        if (newMessages.length > 0) {
            // Update the last check time
            localStorage.setItem('lastChatCheckTime', new Date().toISOString());
            
            // Reload the chat if we have new messages
            loadChatHistory();
            
            // Show notification if chat is closed
            if (chatModal.style.display !== 'flex' && newMessages.length > 0) {
                chatNotification.style.display = 'flex';
                chatNotification.textContent = newMessages.length;
            }
        }
    }
    
    // Update unread count for notification badge
    function updateUnreadCount(messages) {
        // Get the last time the chat was opened
        const lastOpenTime = localStorage.getItem('lastChatOpenTime') || '0';
        
        // Count messages newer than last open time
        const unreadCount = messages.filter(msg => 
            new Date(msg.timestamp) > new Date(lastOpenTime)
        ).length;
        
        // Update notification badge if chat is closed
        if (chatModal.style.display !== 'flex' && unreadCount > 0) {
            chatNotification.style.display = 'flex';
            chatNotification.textContent = unreadCount;
        }
        
        // Update the last open time when the chat is opened
        if (chatModal.style.display === 'flex') {
            localStorage.setItem('lastChatOpenTime', new Date().toISOString());
        }
    }

    // Load team members for chat
    function loadTeamMembers() {
        if (!membersList) return;
        
        // Get active staff from staffSelect
        const activeMembers = [];
        if (staffSelect) {
            for (let i = 0; i < staffSelect.options.length; i++) {
                if (i === 0) continue; // Skip the first "Select Staff Member" option
                
                activeMembers.push({
                    id: staffSelect.options[i].value,
                    name: staffSelect.options[i].text,
                    status: Math.random() > 0.3 ? 'online' : 'offline', // Random status for demo
                    initial: getInitials(staffSelect.options[i].text)
                });
            }
        }
        
        // Add manager/admin to the list
        activeMembers.push({ 
            id: 'manager1', 
            name: 'Manager', 
            status: 'online', 
            initial: 'M' 
        });
        
        // Sort by online status first, then by name
        activeMembers.sort((a, b) => {
            if (a.status === b.status) {
                return a.name.localeCompare(b.name);
            }
            return a.status === 'online' ? -1 : 1;
        });
        
        let html = '';
        
        activeMembers.forEach(member => {
            html += `
                <div class="member-item">
                    <div class="member-avatar">${member.initial}</div>
                    <div class="member-name">${member.name}</div>
                    <div class="member-status ${member.status}">${member.status}</div>
                </div>
            `;
        });
        
        membersList.innerHTML = html;
    }
    
    // Helper function to get initials from a name
    function getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }
});

// Load staff list into dropdowns
function loadStaffList() {
    // In a real application, you would have an endpoint to get all staff
    fetch('/get_staff')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allStaffMembers = data.staff;
                populateStaffDropdowns(allStaffMembers);
            } else {
                console.error('Error loading staff list:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading staff list:', error);
            
            // For development/demo - use mock data if API fails
            console.log('Using mock staff data for development');
            allStaffMembers = [
                { username: 'john', name: 'John Doe', role: 'staff' },
                { username: 'jane', name: 'Jane Smith', role: 'staff' }
            ];
            populateStaffDropdowns(allStaffMembers);
        });
}

// Populate staff dropdowns with staff members
function populateStaffDropdowns(staffMembers) {
    // Populate main staff selector
    if (staffSelect) {
        // Save current selection
        const currentSelection = staffSelect.value;
        
        // Clear all options except first "Select your name" option
        while (staffSelect.options.length > 1) {
            staffSelect.remove(1);
        }
        
        // Add staff options
        staffMembers.forEach(staff => {
            // Skip admin users in the main staff dropdown
            if (staff.role === 'admin') return;
            
            const option = document.createElement('option');
            option.value = staff.username;
            option.textContent = staff.name;
            staffSelect.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentSelection && [...staffSelect.options].some(opt => opt.value === currentSelection)) {
            staffSelect.value = currentSelection;
        }
    }
    
    // Populate swap with staff selector
    if (swapWithStaffSelect) {
        // Save current selection
        const currentSwapSelection = swapWithStaffSelect.value;
        
        // Clear all options except first option
        while (swapWithStaffSelect.options.length > 1) {
            swapWithStaffSelect.remove(1);
        }
        
        // Add staff options
        staffMembers.forEach(staff => {
            // Skip admin users
            if (staff.role === 'admin') return;
            
            const option = document.createElement('option');
            option.value = staff.username;
            option.textContent = staff.name;
            swapWithStaffSelect.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentSwapSelection && [...swapWithStaffSelect.options].some(opt => opt.value === currentSwapSelection)) {
            swapWithStaffSelect.value = currentSwapSelection;
        }
    }
}

// Check for staff updates - compare current staff list with server data
function checkForStaffUpdates() {
    fetch('/get_staff')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const newStaffList = data.staff;
                
                // Check if there are new staff members
                if (newStaffList.length !== allStaffMembers.length) {
                    console.log('Staff list changed, updating dropdowns');
                    allStaffMembers = newStaffList;
                    populateStaffDropdowns(allStaffMembers);
                    showToast('Staff list updated!');
                } else {
                    // Check if any staff member details have changed
                    const hasChanges = newStaffList.some(newStaff => {
                        const existingStaff = allStaffMembers.find(s => s.username === newStaff.username);
                        return !existingStaff || existingStaff.name !== newStaff.name || existingStaff.role !== newStaff.role;
                    });
                    
                    if (hasChanges) {
                        console.log('Staff details changed, updating dropdowns');
                        allStaffMembers = newStaffList;
                        populateStaffDropdowns(allStaffMembers);
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error checking for staff updates:', error);
        });
}

// Handle staff selection change
function handleStaffSelection() {
    const selectedStaff = staffSelect.value;
    const staffIdBadge = document.getElementById('staff-id-badge');
    const staffIdNumber = document.getElementById('staff-id-number');
    
    if (!selectedStaff) {
        // Hide the ID badge if no staff is selected
        staffIdBadge.style.display = 'none';
        return;
    }
    
    // Send selected staff to server
    fetch('/set_staff', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: selectedStaff })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Display the staff ID badge
            staffIdBadge.style.display = 'inline-flex';
            staffIdNumber.textContent = `ID: ${selectedStaff.toUpperCase()}`;
            
            // Show welcome message and reload after delay
            showToast(`Welcome, ${data.name}!`);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showToast('Error: ' + data.message);
            staffIdBadge.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error selecting staff. Please try again.');
        staffIdBadge.style.display = 'none';
    });
}

// Get user's location
function getLocation() {
    if (navigator.geolocation) {
        locationStatus.textContent = 'Detecting location...';
        
        navigator.geolocation.getCurrentPosition(
            // Success callback
            function(position) {
                userLatitude = position.coords.latitude;
                userLongitude = position.coords.longitude;
                
                // Update UI
                locationStatus.textContent = 'Location detected';
            },
            // Error callback
            function(error) {
                let errorMessage;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location unavailable";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out";
                        break;
                    default:
                        errorMessage = "Location error";
                }
                locationStatus.textContent = errorMessage;
            }
        );
    } else {
        locationStatus.textContent = 'Geolocation not supported';
    }
}

// Check if already clocked in
function checkClockInStatus() {
    fetch('/get_shifts')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Update stats
                updateStats(data.shifts);
                
                // Check active shift
                const activeShift = data.shifts.find(shift => shift.clock_out_time === null);
                if (activeShift) {
                    isClockedIn = true;
                    currentShiftId = activeShift.id;
                    updateClockButton('out');
                    
                    // Set branch and role selects to match the active shift
                    branchSelect.value = activeShift.branch_id;
                    roleSelect.value = activeShift.role_id;
                    branchSelect.disabled = true;
                    roleSelect.disabled = true;
                } else {
                    updateClockButton('in');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Update stats based on shift data
function updateStats(shifts) {
    // Update shift count
    document.getElementById('shifts-count').textContent = shifts.length;
    
    // We've removed hours and leaves stats display
}

// Setup admin link button
function setupAdminButton() {
    const adminBtn = document.createElement('a');
    adminBtn.href = '/admin_dashboard';
    adminBtn.id = 'admin-link';
    adminBtn.innerHTML = '<i class="fas fa-user-shield"></i> Admin';
    
    adminBtn.style.position = 'fixed';
    adminBtn.style.bottom = '15px';
    adminBtn.style.left = '50%';
    adminBtn.style.transform = 'translateX(-50%)';
    adminBtn.style.padding = '8px 18px';
    adminBtn.style.borderRadius = '20px';
    adminBtn.style.backgroundColor = 'rgba(44, 62, 80, 0.7)';
    adminBtn.style.color = 'white';
    adminBtn.style.textDecoration = 'none';
    adminBtn.style.fontSize = '0.8rem';
    adminBtn.style.transition = 'all 0.3s ease';
    adminBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    adminBtn.style.zIndex = '100';
    
    adminBtn.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(44, 62, 80, 0.9)';
        this.style.transform = 'translateX(-50%) scale(1.05)';
    });
    
    adminBtn.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'rgba(44, 62, 80, 0.7)';
        this.style.transform = 'translateX(-50%) scale(1)';
    });
    
    document.body.appendChild(adminBtn);
}

// Handle clock in/out button click
function handleClockAction() {
    // Check if a staff member is selected
    if (staffSelect && !staffSelect.value) {
        showToast('Please select your name first.');
        staffSelect.focus();
        return;
    }
    
    if (!userLatitude || !userLongitude) {
        showToast('Location is required. Please allow location access.');
        return;
    }
    
    if (!isClockedIn && !branchSelect.value) {
        showToast('Please select a branch.');
        branchSelect.focus();
        return;
    }
    
    if (!isClockedIn && !roleSelect.value) {
        showToast('Please select a role.');
        roleSelect.focus();
        return;
    }
    
    // Add clicking animation
    clockBtn.classList.add('clicking');
    setTimeout(() => {
        clockBtn.classList.remove('clicking');
    }, 500);
    
    if (!isClockedIn) {
        // Clock In
        clockIn();
    } else {
        // Clock Out
        clockOut();
    }
}

// Clock in function
function clockIn() {
    const data = {
        branch: branchSelect.value,
        role: roleSelect.value,
        latitude: userLatitude,
        longitude: userLongitude
    };
    
    // Send clock in request
    fetch('/clock_in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update UI
            updateClockButton('out');
            isClockedIn = true;
            currentShiftId = data.shift.id;
            
            // Disable branch and role selections
            branchSelect.disabled = true;
            roleSelect.disabled = true;
            
            // Show success message
            showToast('Successfully clocked in!');
            
            // Update shift count
            const currentShifts = parseInt(document.getElementById('shifts-count').textContent) || 0;
            document.getElementById('shifts-count').textContent = currentShifts + 1;
        } else {
            showToast('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error clocking in. Please try again.');
    });
}

// Clock out function
function clockOut() {
    if (!currentShiftId) {
        showToast('No active shift found. Please refresh and try again.');
        return;
    }
    
    const data = {
        shift_id: currentShiftId,
        latitude: userLatitude,
        longitude: userLongitude
    };
    
    // Send clock out request
    fetch('/clock_out', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update UI
            updateClockButton('in');
            isClockedIn = false;
            currentShiftId = null;
            
            // Enable branch and role selections
            branchSelect.disabled = false;
            roleSelect.disabled = false;
            
            // Show success message
            showToast('Successfully clocked out!');
        } else {
            showToast('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error clocking out. Please try again.');
    });
}

// Update clock button appearance
function updateClockButton(mode) {
    // Add flip animation class
    clockBtn.classList.add('button-flip');
    
    // Use setTimeout to change the content during the flip animation
    setTimeout(() => {
        if (mode === 'in') {
            // Clock In state
            clockBtn.classList.remove('clock-out');
            clockBtn.querySelector('.button-icon').className = 'fas fa-clock button-icon';
            clockBtn.querySelector('.button-text').textContent = 'Clock In';
            clockBtn.querySelector('.button-status').innerHTML = '<i class="fas fa-hand-pointer"></i> Tap';
        } else {
            // Clock Out state
            clockBtn.classList.add('clock-out');
            clockBtn.querySelector('.button-icon').className = 'fas fa-stopwatch button-icon';
            clockBtn.querySelector('.button-text').textContent = 'Clock Out';
            clockBtn.querySelector('.button-status').innerHTML = '<i class="fas fa-hand-pointer"></i> Tap';
        }
    }, 300); // Change content at mid-flip
    
    // Remove the animation class after it completes
    setTimeout(() => {
        clockBtn.classList.remove('button-flip');
    }, 600);
}

// Animate circle buttons
function animateCircleButtons() {
    // Create and append status element
    if (!document.querySelector('.clock-status')) {
        const statusEl = document.createElement('div');
        statusEl.className = 'clock-status';
        document.querySelector('.button-container').appendChild(statusEl);
    }
}

// Open leave request modal
function openLeaveModal() {
    // Check if a staff member is selected
    if (staffSelect && !staffSelect.value) {
        showToast('Please select your name first.');
        staffSelect.focus();
        return;
    }
    
    leaveModal.style.display = 'block';
    
    // Add clicking animation to leave button
    leaveBtn.classList.add('clicking');
    setTimeout(() => {
        leaveBtn.classList.remove('clicking');
    }, 500);
}

// Open shift change request modal
function openShiftChangeModal() {
    // Check if a staff member is selected
    if (staffSelect && !staffSelect.value) {
        showToast('Please select your name first.');
        staffSelect.focus();
        return;
    }
    
    // Load user shifts
    loadUserShifts();
    
    shiftChangeModal.style.display = 'block';
    
    // Add clicking animation to swap shift button
    swapShiftBtn.classList.add('clicking');
    setTimeout(() => {
        swapShiftBtn.classList.remove('clicking');
    }, 500);
}

// Load user shifts for the shift change modal
function loadUserShifts() {
    console.log("Loading user shifts, myShiftSelect exists:", myShiftSelect !== null);
    
    // Handle case where myShiftSelect is not found
    if (!myShiftSelect) {
        console.error("myShiftSelect element not found");
        showToast("Error: Could not load shift selection menu");
        return;
    }
    
    // Clear previous options except the default one
    myShiftSelect.innerHTML = '<option value="">Select your shift</option>';
    
    // Fetch shifts from the server
    fetch('/get_shifts')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Store shifts data
                userShifts = data.shifts;
                console.log("Shifts loaded:", userShifts.length);
                
                // Filter out shifts that can be swapped (completed shifts)
                const swappableShifts = userShifts.filter(shift => shift.clock_out_time !== null);
                console.log("Swappable shifts:", swappableShifts.length);
                
                if (swappableShifts.length === 0) {
                    // If no swappable shifts, add a disabled option
                    const option = document.createElement('option');
                    option.disabled = true;
                    option.textContent = 'No completed shifts available to swap';
                    myShiftSelect.appendChild(option);
                } else {
                    // Add shifts to dropdown
                    swappableShifts.forEach(shift => {
                        const option = document.createElement('option');
                        option.value = shift.id;
                        
                        // Format the display text
                        const shiftDate = formatDate(new Date(shift.clock_in_time));
                        const clockInTime = new Date(shift.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const clockOutTime = new Date(shift.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        option.textContent = `${shiftDate} (${clockInTime} - ${clockOutTime}) at ${shift.branch}`;
                        myShiftSelect.appendChild(option);
                    });
                }
            } else {
                console.error("Error in API response:", data);
                showToast('Error loading shifts');
            }
        })
        .catch(error => {
            console.error('Error loading shifts:', error);
            showToast('Error loading shifts. Please try again.');
        });
}

// Close all modals
function closeModals() {
    leaveModal.style.display = 'none';
    shiftChangeModal.style.display = 'none';
}

// Submit leave request
function submitLeaveRequest() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const reason = document.getElementById('leave-reason').value;
    
    if (!startDate) {
        showToast('Please select a start date.');
        return;
    }
    
    if (!endDate) {
        showToast('Please select an end date.');
        return;
    }
    
    if (!reason) {
        showToast('Please provide a reason for your leave.');
        return;
    }
    
    const data = {
        start_date: startDate,
        end_date: endDate,
        reason: reason
    };
    
    // Send leave request
    fetch('/request_leave', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Close modal
            closeModals();
            
            // Reset form
            document.getElementById('start-date').value = '';
            document.getElementById('end-date').value = '';
            document.getElementById('leave-reason').value = '';
            
            // Show success message
            showToast('Leave request submitted successfully!');
        } else {
            showToast('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error submitting leave request.');
    });
}

// Submit shift change request
function submitShiftChangeRequest() {
    const selectedShift = myShiftSelect.value;
    const targetUsername = document.getElementById('swap-with-staff').value;
    const reason = document.getElementById('swap-reason').value;
    
    if (!selectedShift) {
        showToast('Please select a shift to swap.');
        return;
    }
    
    if (!targetUsername) {
        showToast('Please select a staff member to swap with.');
        return;
    }
    
    if (!reason) {
        showToast('Please provide a reason for the shift change.');
        return;
    }
    
    const data = {
        shift_id: selectedShift,
        target_username: targetUsername,
        reason: reason
    };
    
    // Send shift change request
    fetch('/request_shift_change', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Close modal
            closeModals();
            
            // Reset form
            myShiftSelect.value = '';
            document.getElementById('swap-with-staff').value = '';
            document.getElementById('swap-reason').value = '';
            
            // Show success message
            showToast('Shift change request submitted successfully!');
        } else {
            showToast('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error submitting shift change request.');
    });
}

// Show a toast message
function showToast(message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '30px';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translateX(-50%)';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Style toast
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '25px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    toast.style.textAlign = 'center';
    toast.style.minWidth = '200px';
    toast.style.animation = 'fadeInOut 3s';
    
    // Add animation styles
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
    
    // Append toast to container
    toastContainer.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Helper function to format date
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Helper function to format date and time
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    return `${date.toLocaleDateString('en-US', dateOptions)} ${date.toLocaleTimeString('en-US', timeOptions)}`;
}

// Load branches from server or use mock data for development
function loadBranches() {
    if (!branchSelect) return;
    
    // In a real application, you would fetch this from the server
    fetch('/get_branches')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allBranches = data.branches;
                populateBranchDropdown(allBranches);
            } else {
                console.error('Error loading branches:', data.message);
                // Use mock data for development
                useMockBranchData();
            }
        })
        .catch(error => {
            console.error('Error loading branches:', error);
            // Use mock data for development
            useMockBranchData();
        });
}

// Populate branch dropdown with branch data
function populateBranchDropdown(branches) {
    if (!branchSelect) return;
    
    // Save current selection
    const currentSelection = branchSelect.value;
    
    // Clear all options except first option
    while (branchSelect.options.length > 1) {
        branchSelect.remove(1);
    }
    
    // Add branch options
    for (const [branchId, branch] of Object.entries(branches)) {
        const option = document.createElement('option');
        option.value = branchId;
        option.textContent = branch.name;
        
        // Add highlight class for newly added branches
        if (branch.isNew) {
            option.classList.add('newly-added-option');
            option.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
            option.style.fontWeight = 'bold';
            
            // Remove highlight after a few seconds
            setTimeout(() => {
                option.classList.remove('newly-added-option');
                option.style.backgroundColor = '';
                option.style.fontWeight = '';
            }, 5000);
        }
        
        branchSelect.appendChild(option);
    }
    
    // Restore selection if it still exists
    if (currentSelection && [...branchSelect.options].some(opt => opt.value === currentSelection)) {
        branchSelect.value = currentSelection;
    }
    
    // If clocked in, disable branch selection
    if (isClockedIn) {
        branchSelect.disabled = true;
    }
}

// Load roles from server or use mock data for development
function loadRoles() {
    if (!roleSelect) return;
    
    fetch('/get_roles')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allRoles = data.roles;
                populateRoleDropdown(allRoles);
            } else {
                console.error('Error loading roles:', data.message);
                // Use mock data for development
                useMockRoleData();
            }
        })
        .catch(error => {
            console.error('Error loading roles:', error);
            // Use mock data for development
            useMockRoleData();
        });
}

// Populate role dropdown with role data
function populateRoleDropdown(roles) {
    if (!roleSelect) return;
    
    // Save current selection
    const currentSelection = roleSelect.value;
    
    // Clear all options except first option
    while (roleSelect.options.length > 1) {
        roleSelect.remove(1);
    }
    
    // Add role options
    for (const [roleId, role] of Object.entries(roles)) {
        const option = document.createElement('option');
        option.value = roleId;
        option.textContent = role.name;
        
        // Add highlight class for newly added roles
        if (role.isNew) {
            option.classList.add('newly-added-option');
            option.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
            option.style.fontWeight = 'bold';
            
            // Remove highlight after a few seconds
            setTimeout(() => {
                option.classList.remove('newly-added-option');
                option.style.backgroundColor = '';
                option.style.fontWeight = '';
            }, 5000);
        }
        
        roleSelect.appendChild(option);
    }
    
    // Restore selection if it still exists
    if (currentSelection && [...roleSelect.options].some(opt => opt.value === currentSelection)) {
        roleSelect.value = currentSelection;
    }
    
    // If clocked in, disable role selection
    if (isClockedIn) {
        roleSelect.disabled = true;
    }
}

// Use mock branch data for development/demo when API is not available
function useMockBranchData() {
    console.log('Using mock branch data for development');
    allBranches = {
        branch1: { name: "Headquarters", location: "New York" },
        branch2: { name: "Downtown Office", location: "Chicago" },
        branch3: { name: "West Coast", location: "San Francisco" }
    };
    populateBranchDropdown(allBranches);
}

// Use mock role data for development/demo when API is not available
function useMockRoleData() {
    console.log('Using mock role data for development');
    allRoles = {
        manager: { name: "Manager" },
        supervisor: { name: "Supervisor" },
        associate: { name: "Associate" }
    };
    populateRoleDropdown(allRoles);
}

// Set up real-time updates from the admin portal
function setupRealtimeUpdates() {
    // Listen for localStorage changes (used for real-time updates between tabs)
    window.addEventListener('storage', function(e) {
        if (e.key === 'staff_portal_update') {
            handlePortalUpdate(JSON.parse(e.newValue));
        }
    });
    
    // Listen for the custom event from same-tab updates
    window.addEventListener('staff-portal-update', function(e) {
        handlePortalUpdate(e.detail);
    });
    
    // Check if there's any update in localStorage from a previous session
    const storedUpdate = localStorage.getItem('staff_portal_update');
    if (storedUpdate) {
        try {
            const updateData = JSON.parse(storedUpdate);
            // Only process updates from the last 5 minutes
            const updateTime = new Date(updateData.timestamp);
            const now = new Date();
            if ((now - updateTime) < 5 * 60 * 1000) { // 5 minutes in milliseconds
                handlePortalUpdate(updateData);
            }
        } catch (e) {
            console.error('Error parsing stored update:', e);
        }
    }
}

// Handle updates from admin portal
function handlePortalUpdate(update) {
    if (!update || !update.type) return;
    
    console.log('Received update from admin portal:', update.type);
    
    switch (update.type) {
        case 'branch':
            // Add new branch to local data
            if (update.data && update.data.id && update.data.name) {
                allBranches[update.data.id] = {
                    name: update.data.name,
                    location: update.data.location || '',
                    isNew: true
                };
                populateBranchDropdown(allBranches);
                showToast(`New branch added: ${update.data.name}`);
            }
            break;
            
        case 'branch-delete':
            // Remove branch from local data
            if (update.data && update.data.id && allBranches[update.data.id]) {
                delete allBranches[update.data.id];
                populateBranchDropdown(allBranches);
                showToast(`Branch removed: ${update.data.name}`);
            }
            break;
            
        case 'role':
            // Add new role to local data
            if (update.data && update.data.id && update.data.name) {
                allRoles[update.data.id] = {
                    name: update.data.name,
                    isNew: true
                };
                populateRoleDropdown(allRoles);
                showToast(`New role added: ${update.data.name}`);
            }
            break;
            
        case 'role-delete':
            // Remove role from local data
            if (update.data && update.data.id && allRoles[update.data.id]) {
                delete allRoles[update.data.id];
                populateRoleDropdown(allRoles);
                showToast(`Role removed: ${update.data.name}`);
            }
            break;
    }
}

// Trigger the alarm
function triggerAlarm(planIndex) {
    const plans = JSON.parse(localStorage.getItem('staffPlans') || '[]');
    const plan = plans[planIndex];
    
    if (!plan) return; // Plan might have been deleted
    
    // Show an alert
    alert(`ALARM: Time to "${plan.text}"!`);
    
    // Add visual indication
    const activeAlarm = document.getElementById('active-alarm');
    activeAlarm && activeAlarm.classList.add('alarm-ringing');
    
    // Play a sound (optional)
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    audio.play().catch(e => console.log('Audio could not play: ', e));
    
    // Mark the plan as expiring soon
    const planElements = document.querySelectorAll('.plan-item');
    if (planElements && planElements[planIndex]) {
        planElements[planIndex].classList.add('plan-expiring-soon');
    }
    
    // Add time of deletion to the plan data
    const now = new Date();
    plans[planIndex].deleteAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 30 minutes from now
    localStorage.setItem('staffPlans', JSON.stringify(plans));
    
    // Show a toast notification
    showToast('Plan will be auto-deleted in 30 minutes');
    
    // Set a timeout to auto-delete the plan 30 minutes after the alarm rings
    setTimeout(() => {
        deletePlan(planIndex);
        showToast('Plan automatically deleted');
    }, 30 * 60 * 1000); // 30 minutes
}

// Clean up expired plans
function cleanupExpiredPlans() {
    const plans = JSON.parse(localStorage.getItem('staffPlans') || '[]');
    const now = new Date();
    let hasChanges = false;
    
    const activePlans = plans.filter(plan => {
        // Check if plan has expired (general expiry)
        const isPlanExpired = new Date(plan.expires) <= now;
        
        // Check if plan should be deleted after alarm (30 min rule)
        const shouldDeleteAfterAlarm = plan.deleteAt && new Date(plan.deleteAt) <= now;
        
        // Keep plan only if it's not expired and not due for deletion after alarm
        return !isPlanExpired && !shouldDeleteAfterAlarm;
    });
    
    if (activePlans.length !== plans.length) {
        localStorage.setItem('staffPlans', JSON.stringify(activePlans));
        hasChanges = true;
    }
    
    return hasChanges;
}