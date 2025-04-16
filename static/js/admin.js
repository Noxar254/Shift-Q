// DOM Elements for Tabs
const tabLinks = document.querySelectorAll('.admin-sidebar nav ul li');
const tabContents = document.querySelectorAll('.tab-content');
const staffModal = document.getElementById('staff-modal');
const closeModalBtn = document.querySelector('#staff-modal .close-modal');
const addStaffBtn = document.getElementById('add-staff-btn');
const saveStaffBtn = document.getElementById('save-staff');

// DOM Elements for staff photo upload
const staffPhotoInput = document.getElementById('staff-photo');
const photoPreview = document.getElementById('photo-preview');
const staffPhotoPreviewImg = document.getElementById('staff-photo-preview');
const removePhotoBtn = document.getElementById('remove-photo');

// DOM Elements for Dashboard stats
const presentCountElem = document.getElementById('present-count');
const absentCountElem = document.getElementById('absent-count');
const leaveCountElem = document.getElementById('leave-count');
const shiftCountElem = document.getElementById('shift-count');

// DOM Elements for Tables
const activeStaffTable = document.getElementById('active-staff-table');
const leaveRequestsTable = document.getElementById('leave-requests-table');
const staffTable = document.getElementById('staff-table');
const shiftsTable = document.getElementById('shifts-table');
const allLeaveRequestsTable = document.getElementById('all-leave-requests-table');

// DOM Elements for Settings
const addBranchBtn = document.getElementById('add-branch');
const addRoleBtn = document.getElementById('add-role');
const branchesList = document.getElementById('branches-list');
const rolesList = document.getElementById('roles-list');

// DOM Elements for Notifications
const notificationBadge = document.querySelector('.notification-badge');
const notificationList = document.getElementById('notification-list');
const markAllReadBtn = document.getElementById('mark-all-read');
const notificationFilter = document.getElementById('notification-filter');

// DOM Elements for Insights
const insightsTabContent = document.getElementById('insights-tab');
const attendanceChart = document.getElementById('attendance-chart');
const shiftDistributionChart = document.getElementById('shift-distribution-chart');
const leaveAnalysisChart = document.getElementById('leave-analysis-chart');
const performanceTable = document.getElementById('performance-table');
const insightsPeriodFilter = document.getElementById('insights-period-filter');
const insightsBranchFilter = document.getElementById('insights-branch-filter');

// Chat related DOM elements
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

// DOM Elements for Meetings
const meetingBtn = document.getElementById('meeting-btn');
const meetingModal = document.getElementById('meeting-modal');
const closeMeetingBtn = document.querySelector('#meeting-modal .close-modal');
const instantMeetingBtn = document.getElementById('instant-meeting-btn');
const scheduleMeetingBtn = document.getElementById('schedule-meeting-btn');
const meetingForm = document.getElementById('meeting-form');
const createMeetingBtn = document.getElementById('create-meeting-btn');
const meetingSuccess = document.getElementById('meeting-success');
const meetingDetails = document.getElementById('meeting-details');
const copyMeetingLinkBtn = document.getElementById('copy-meeting-link');
const sendMeetingInvitesBtn = document.getElementById('send-meeting-invites');
const startMeetingCard = document.getElementById('start-meeting-card');
const meetingNotification = document.getElementById('meeting-notification');

// Global variables for data management
let allStaff = [];
let allShifts = [];
let allLeaveRequests = [];
let allShiftChangeRequests = [];
let allBranches = {};
let allRoles = {};

// Global variables to store notification data
let notifications = [];
let unreadCount = 0;

// Global variables for late employee tracking
let lateEmployees = [];
let warningHistory = [];
let lateThresholdMinutes = 15; // Default threshold for lateness (15 minutes)
let monitoringInterval = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set up tab navigation
    setupTabs();
    
    // Load data from server
    loadDashboardData();
    loadStaff();
    loadShifts();
    loadLeaveRequests();
    loadBranches();
    loadRoles();
    
    // Event listeners for adding/editing staff
    addStaffBtn.addEventListener('click', openAddStaffModal);
    closeModalBtn.addEventListener('click', closeStaffModal);
    saveStaffBtn.addEventListener('click', saveStaff);
    
    // Event listeners for photo upload
    staffPhotoInput.addEventListener('change', handlePhotoUpload);
    removePhotoBtn.addEventListener('click', removePhoto);
    
    // Event listeners for branches and roles
    addBranchBtn.addEventListener('click', addBranch);
    addRoleBtn.addEventListener('click', addRole);
    
    // Event listener for tab changes
    window.addEventListener('click', function(e) {
        if (e.target === staffModal) {
            closeStaffModal();
        }
    });
    
    // Set up filtering for shifts
    document.getElementById('shift-date-filter').addEventListener('change', filterShifts);
    document.getElementById('branch-filter').addEventListener('change', filterShifts);
    
    // Set up filtering for leave requests
    document.getElementById('leave-status-filter').addEventListener('change', filterLeaveRequests);
    
    // Export shifts button
    document.getElementById('export-shifts').addEventListener('click', exportShifts);
    
    // Auto-refresh data every 60 seconds
    setInterval(refreshData, 60000);

    // Initialize notification system
    loadNotifications();
    
    // Initialize insights dashboard
    if (insightsTabContent) {
        setupCharts();
        insightsPeriodFilter.addEventListener('change', updateAllCharts);
        insightsBranchFilter.addEventListener('change', updateAllCharts);
    }
    
    // Event listeners for notification actions
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    }
    
    if (notificationFilter) {
        notificationFilter.addEventListener('change', filterNotifications);
    }
    
    // Add click event delegation for notification actions
    if (notificationList) {
        notificationList.addEventListener('click', function(e) {
            if (e.target.closest('.btn-action.read-notification')) {
                const notificationId = e.target.closest('.btn-action.read-notification').getAttribute('data-id');
                markAsRead(notificationId);
            } else if (e.target.closest('.btn-action.approve')) {
                const notificationId = e.target.closest('.btn-action.approve').getAttribute('data-id');
                approveNotification(notificationId);
            } else if (e.target.closest('.btn-action.reject')) {
                const notificationId = e.target.closest('.btn-action.reject').getAttribute('data-id');
                rejectNotification(notificationId);
            } else if (e.target.closest('.btn-action.send-warning')) {
                const notificationId = e.target.closest('.btn-action.send-warning').getAttribute('data-id');
                openWarningLetterModal(notificationId);
            }
        });
    }

    // Initialize team chat
    initializeChat();
    
    // Initialize late employee monitoring
    initializeLateEmployeeMonitoring();
    
    // Add lateness threshold settings in settings tab
    setupLatenessSettings();

    // Initialize meetings feature
    initializeMeetings();

    // Setup real-time event handling from staff portal
    setupStaffEventListener();
});

// Set up tab navigation
function setupTabs() {
    tabLinks.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabLinks.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// Load dashboard data
function loadDashboardData() {
    // Load active staff and shifts
    fetch('/get_shifts')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateDashboardStats(data.shifts);
                displayActiveStaff(data.shifts);
            }
        })
        .catch(error => console.error('Error:', error));
    
    // Load leave requests
    fetch('/get_leave_requests')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateLeaveStats(data.leave_requests);
                displayPendingLeaveRequests(data.leave_requests);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Update dashboard statistics
function updateDashboardStats(shifts) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count active staff (clocked in but not out)
    const activeStaff = shifts.filter(shift => 
        shift.clock_out_time === null
    );
    
    // Count shifts for today
    const todayShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.clock_in_time);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate.getTime() === today.getTime();
    });
    
    // Update UI
    presentCountElem.textContent = activeStaff.length;
    shiftCountElem.textContent = todayShifts.length;
    
    // Placeholder for absent count - in a real system this would require staff schedules
    // Here we'll just set a dummy value
    absentCountElem.textContent = '0';
}

// Update leave statistics
function updateLeaveStats(leaveRequests) {
    const pendingLeaveRequests = leaveRequests.filter(request => 
        request.status === 'pending'
    );
    
    // Update UI
    leaveCountElem.textContent = pendingLeaveRequests.length;
}

// Display active staff in dashboard
function displayActiveStaff(shifts) {
    // Filter to get only active shifts (not clocked out)
    const activeShifts = shifts.filter(shift => shift.clock_out_time === null);
    
    if (activeShifts.length === 0) {
        activeStaffTable.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">No active staff members at the moment.</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    activeShifts.forEach(shift => {
        const clockInTime = formatDateTime(shift.clock_in_time);
        
        html += `
            <tr data-staff-id="${shift.id || ''}" data-staff-name="${shift.name || ''}">
                <td>${shift.name}</td>
                <td>${shift.branch}</td>
                <td>${shift.role}</td>
                <td>${clockInTime}</td>
                <td>${shift.clock_in_location.address}</td>
            </tr>
        `;
    });
    
    activeStaffTable.innerHTML = html;
}

// Display pending leave requests in dashboard with real-time updates
function displayPendingLeaveRequests(leaveRequests) {
    // Filter to get only pending requests
    const pendingRequests = leaveRequests.filter(request => request.status === 'pending');
    
    if (pendingRequests.length === 0) {
        leaveRequestsTable.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">No pending leave requests.</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    pendingRequests.forEach(request => {
        // Add a class for newly added requests if marked
        const isNewRequest = request.isNew ? ' class="highlighted-new"' : '';
        
        html += `
            <tr${isNewRequest}>
                <td>${request.name}</td>
                <td>${formatDate(new Date(request.start_date))}</td>
                <td>${formatDate(new Date(request.end_date))}</td>
                <td>${request.reason}</td>
                <td>
                    <button class="btn-action approve" data-id="${request.id}">Approve</button>
                    <button class="btn-action reject" data-id="${request.id}">Reject</button>
                </td>
            </tr>
        `;
        
        // Remove the 'isNew' flag after displaying
        if (request.isNew) {
            delete request.isNew;
        }
    });
    
    leaveRequestsTable.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('#leave-requests-table .btn-action').forEach(btn => {
        btn.addEventListener('click', handleLeaveAction);
    });
    
    // Ensure the real-time indicator is shown for this table
    ensureRealTimeIndicator(leaveRequestsTable);
}

// Handle leave request approval/rejection
function handleLeaveAction(e) {
    const leaveId = e.target.getAttribute('data-id');
    const action = e.target.classList.contains('approve') ? 'approved' : 'rejected';
    
    const data = {
        leave_id: leaveId,
        status: action
    };
    
    fetch('/approve_leave', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Refresh leave requests data
            loadLeaveRequests();
            loadDashboardData();
            alert(`Leave request has been ${action}.`);
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing the leave request.');
    });
}

// Load all staff
function loadStaff() {
    // In a real application, you would have an endpoint to get all staff
    // For this example, we'll simulate it
    staffTable.innerHTML = '<tr><td colspan="4" class="loading-cell">Loading staff data...</td></tr>';
    
    // Simulated API call - in a real app, replace with actual endpoint
    setTimeout(() => {
        allStaff = [
            { username: 'admin', name: 'Administrator', role: 'admin' },
            { username: 'john', name: 'John Doe', role: 'staff' },
            { username: 'jane', name: 'Jane Smith', role: 'staff' }
        ];
        displayStaff();
    }, 500);
}

// Enhanced display staff with better UI feedback
function displayStaff() {
    if (allStaff.length === 0) {
        staffTable.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">No staff members found.</td>
            </tr>
        `;
        return;
    }
    
    // Sort staff alphabetically by name for better organization
    allStaff.sort((a, b) => a.name.localeCompare(b.name));
    
    let html = '';
    allStaff.forEach(staff => {
        const staffId = staff.id || 'Not assigned';
        // Add a class to highlight newly added staff members
        const isNewlyAdded = staff.isNew ? 'class="newly-added"' : '';
        
        html += `
            <tr ${isNewlyAdded}>
                <td>${staffId}</td>
                <td>${staff.username}</td>
                <td>${staff.name}</td>
                <td>${staff.role}</td>
                <td>
                    <button class="btn-action edit" data-username="${staff.username}">Edit</button>
                    <button class="btn-action delete" data-username="${staff.username}">Delete</button>
                </td>
            </tr>
        `;
        
        // Remove the 'isNew' flag after displaying
        if (staff.isNew) staff.isNew = false;
    });
    
    staffTable.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('#staff-table .btn-action').forEach(btn => {
        btn.addEventListener('click', handleStaffAction);
    });
    
    // Update any staff selectors/dropdowns
    updateStaffSelectors();
}

// Handle staff edit/delete actions
function handleStaffAction(e) {
    const username = e.target.getAttribute('data-username');
    
    if (e.target.classList.contains('edit')) {
        // Open edit modal
        openEditStaffModal(username);
    } else if (e.target.classList.contains('delete')) {
        // Confirm delete
        if (confirm(`Are you sure you want to delete staff member: ${username}?`)) {
            deleteStaff(username);
        }
    }
}

// Open add staff modal
function openAddStaffModal() {
    // Reset form
    document.getElementById('staff-modal-title').textContent = 'Add New Staff';
    document.getElementById('staff-id').value = '';
    document.getElementById('staff-username').value = '';
    document.getElementById('staff-fullname').value = '';
    document.getElementById('staff-role').value = 'staff';
    
    // Enable username field
    document.getElementById('staff-username').disabled = false;
    document.getElementById('staff-id').disabled = false;
    
    // Set mode
    saveStaffBtn.setAttribute('data-mode', 'add');
    
    // Show modal
    staffModal.style.display = 'block';
}

// Open edit staff modal
function openEditStaffModal(username) {
    const staff = allStaff.find(s => s.username === username);
    if (!staff) return;
    
    // Fill form
    document.getElementById('staff-modal-title').textContent = 'Edit Staff';
    document.getElementById('staff-id').value = staff.id || '';
    document.getElementById('staff-username').value = staff.username;
    document.getElementById('staff-fullname').value = staff.name;
    document.getElementById('staff-role').value = staff.role;
    
    // Disable username and ID fields for editing - these should remain consistent
    document.getElementById('staff-username').disabled = true;
    document.getElementById('staff-id').disabled = true;
    
    // Set mode
    saveStaffBtn.setAttribute('data-mode', 'edit');
    
    // Show modal
    staffModal.style.display = 'block';
}

// Close staff modal
function closeStaffModal() {
    staffModal.style.display = 'none';
}

// Save staff (add or edit)
function saveStaff() {
    const mode = saveStaffBtn.getAttribute('data-mode');
    const staffId = document.getElementById('staff-id').value.trim();
    const username = document.getElementById('staff-username').value.trim();
    const name = document.getElementById('staff-fullname').value.trim();
    const role = document.getElementById('staff-role').value;
    
    // Enhanced validation
    if (!staffId) {
        alert('Please enter a Staff ID.');
        return;
    }
    
    if (!username) {
        alert('Please enter a Username.');
        return;
    }
    
    if (!name) {
        alert('Please enter a Full Name.');
        return;
    }
    
    // In a real application, you would send this data to the server
    // For this example, we'll just update the local data
    if (mode === 'add') {
        // Check if username or staffId exists
        if (allStaff.some(s => s.username === username)) {
            alert('Username already exists.');
            return;
        }
        
        if (allStaff.some(s => s.id === staffId)) {
            alert('Staff ID already exists.');
            return;
        }
        
        // Get photo data if uploaded
        let photoData = null;
        if (staffPhotoPreviewImg.src && staffPhotoPreviewImg.src !== window.location.href) {
            photoData = staffPhotoPreviewImg.src;
        }
        
        // Add new staff with ID and photo
        const newStaff = { 
            id: staffId, 
            username, 
            name, 
            role,
            photo: photoData 
        };
        
        allStaff.push(newStaff);
        
        // In a real app, send to server
        // fetch('/add_staff', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(newStaff)
        // })
        // .then(response => response.json())
        // .then(data => {
        //     if (data.status === 'success') {
        //         // Update local data with server data
        //         allStaff.push(data.staff);
        //         displayStaff();
        //         closeStaffModal();
        //         alert('Staff added successfully.');
        //     } else {
        //         alert('Error: ' + data.message);
        //     }
        // })
        // .catch(error => {
        //     console.error('Error:', error);
        //     alert('An error occurred while adding staff.');
        // });
    } else {
        // Edit existing staff
        const staffIndex = allStaff.findIndex(s => s.username === username);
        if (staffIndex !== -1) {
            // Get photo data if changed
            if (staffPhotoPreviewImg.src && staffPhotoPreviewImg.src !== window.location.href &&
                allStaff[staffIndex].photo !== staffPhotoPreviewImg.src) {
                allStaff[staffIndex].photo = staffPhotoPreviewImg.src;
            }
            
            allStaff[staffIndex].name = name;
            allStaff[staffIndex].role = role;
            // Keep the existing ID or update if not present
            if (!allStaff[staffIndex].id) {
                allStaff[staffIndex].id = staffId;
            }
        }
    }
    
    // Update UI
    displayStaff();
    
    // Close modal
    closeStaffModal();
    
    // Show success message
    alert(`Staff ${mode === 'add' ? 'added' : 'updated'} successfully.`);
    
    // Update any dropdowns or selectors that might contain staff information
    updateStaffSelectors();
}

// Delete staff
function deleteStaff(username) {
    // Remove from array
    allStaff = allStaff.filter(staff => staff.username !== username);
    
    // Update UI
    displayStaff();
    
    // Show success message
    alert('Staff deleted successfully.');
}

// Update any staff selectors/dropdowns throughout the app
function updateStaffSelectors() {
    // This function would update any dropdowns or selectors that contain staff information
    // For example, if there were dropdown menus for selecting staff in other parts of the app
    
    // For instance, if you have a staff selector in shift assignment form
    const staffSelectors = document.querySelectorAll('.staff-selector');
    
    if (staffSelectors.length > 0) {
        staffSelectors.forEach(selector => {
            // Store current selection if it exists
            const currentSelection = selector.value;
            
            // Clear existing options except the default "Select staff" option
            while (selector.options.length > 1) {
                selector.remove(1);
            }
            
            // Add options for each staff member
            allStaff.forEach(staff => {
                const option = document.createElement('option');
                option.value = staff.username;
                option.textContent = `${staff.name} (${staff.role})`;
                selector.appendChild(option);
            });
            
            // Restore selection if it still exists
            if (currentSelection && [...selector.options].some(opt => opt.value === currentSelection)) {
                selector.value = currentSelection;
            }
        });
    }
}

// Load all shifts
function loadShifts() {
    shiftsTable.innerHTML = '<tr><td colspan="7" class="loading-cell">Loading shifts data...</td></tr>';
    
    fetch('/get_shifts')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allShifts = data.shifts;
                displayShifts(allShifts);
                
                // Populate branch filter
                populateBranchFilter();
            } else {
                shiftsTable.innerHTML = '<tr><td colspan="7" class="loading-cell">Error loading shifts.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            shiftsTable.innerHTML = '<tr><td colspan="7" class="loading-cell">Error loading shifts.</td></tr>';
        });
}

// Display shifts in shifts tab
function displayShifts(shifts) {
    if (shifts.length === 0) {
        shiftsTable.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">No shifts found.</td>
            </tr>
        `;
        return;
    }
    
    // Sort shifts by clock-in time (most recent first)
    shifts.sort((a, b) => new Date(b.clock_in_time) - new Date(a.clock_in_time));
    
    let html = '';
    shifts.forEach(shift => {
        const clockInTime = formatDateTime(shift.clock_in_time);
        const clockOutTime = shift.clock_out_time ? formatDateTime(shift.clock_out_time) : 'Not clocked out';
        
        let duration = 'In Progress';
        if (shift.clock_out_time) {
            const clockInDate = new Date(shift.clock_in_time);
            const clockOutDate = new Date(shift.clock_out_time);
            const durationMs = clockOutDate - clockInDate;
            const durationHrs = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            duration = `${durationHrs}h ${durationMins}m`;
        }
        
        html += `
            <tr>
                <td>${shift.name}</td>
                <td>${shift.branch}</td>
                <td>${shift.role}</td>
                <td>${clockInTime}</td>
                <td>${clockOutTime}</td>
                <td>${duration}</td>
                <td>${shift.clock_in_location.address}</td>
            </tr>
        `;
    });
    
    shiftsTable.innerHTML = html;
}

// Populate branch filter dropdown
function populateBranchFilter() {
    const branchFilter = document.getElementById('branch-filter');
    const branches = [...new Set(allShifts.map(shift => shift.branch))];
    
    // Add options
    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch;
        option.textContent = branch;
        branchFilter.appendChild(option);
    });
}

// Filter shifts based on date and branch
function filterShifts() {
    const dateFilter = document.getElementById('shift-date-filter').value;
    const branchFilter = document.getElementById('branch-filter').value;
    
    let filtered = [...allShifts];
    
    // Filter by date
    if (dateFilter) {
        const selectedDate = new Date(dateFilter);
        selectedDate.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(shift => {
            const shiftDate = new Date(shift.clock_in_time);
            shiftDate.setHours(0, 0, 0, 0);
            return shiftDate.getTime() === selectedDate.getTime();
        });
    }
    
    // Filter by branch
    if (branchFilter) {
        filtered = filtered.filter(shift => shift.branch === branchFilter);
    }
    
    // Display filtered shifts
    displayShifts(filtered);
}

// Export shifts to CSV
function exportShifts() {
    const dateFilter = document.getElementById('shift-date-filter').value;
    const branchFilter = document.getElementById('branch-filter').value;
    
    // Create filter description for filename
    let filterDesc = 'all';
    if (dateFilter) filterDesc = `date_${dateFilter}`;
    if (branchFilter) filterDesc += `_branch_${branchFilter}`;
    
    // Get filtered shifts
    let filtered = [...allShifts];
    
    // Filter by date
    if (dateFilter) {
        const selectedDate = new Date(dateFilter);
        selectedDate.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(shift => {
            const shiftDate = new Date(shift.clock_in_time);
            shiftDate.setHours(0, 0, 0, 0);
            return shiftDate.getTime() === selectedDate.getTime();
        });
    }
    
    // Filter by branch
    if (branchFilter) {
        filtered = filtered.filter(shift => shift.branch === branchFilter);
    }
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Name,Branch,Role,Clock In,Clock Out,Duration,Location\n';
    
    filtered.forEach(shift => {
        const clockInTime = formatDateTime(shift.clock_in_time);
        const clockOutTime = shift.clock_out_time ? formatDateTime(shift.clock_out_time) : 'Not clocked out';
        
        let duration = 'In Progress';
        if (shift.clock_out_time) {
            const clockInDate = new Date(shift.clock_in_time);
            const clockOutDate = new Date(shift.clock_out_time);
            const durationMs = clockOutDate - clockInDate;
            const durationHrs = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            duration = `${durationHrs}h ${durationMins}m`;
        }
        
        csvContent += `${shift.name},${shift.branch},${shift.role},${clockInTime},${clockOutTime},${duration},"${shift.clock_in_location.address}"\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shifts_${filterDesc}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Load all leave requests
function loadLeaveRequests() {
    allLeaveRequestsTable.innerHTML = '<tr><td colspan="6" class="loading-cell">Loading leave requests...</td></tr>';
    
    fetch('/get_leave_requests')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allLeaveRequests = data.leave_requests;
                displayAllLeaveRequests(allLeaveRequests);
            } else {
                allLeaveRequestsTable.innerHTML = '<tr><td colspan="6" class="loading-cell">Error loading leave requests.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            allLeaveRequestsTable.innerHTML = '<tr><td colspan="6" class="loading-cell">Error loading leave requests.</td></tr>';
        });
}

// Display all leave requests in leave tab
function displayAllLeaveRequests(requests) {
    if (requests.length === 0) {
        allLeaveRequestsTable.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">No leave requests found.</td>
            </tr>
        `;
        return;
    }
    
    // Sort leave requests by submission date (most recent first)
    requests.sort((a, b) => new Date(b.submitted_on) - new Date(a.submitted_on));
    
    let html = '';
    requests.forEach(request => {
        const startDate = formatDate(new Date(request.start_date));
        const endDate = formatDate(new Date(request.end_date));
        
        let statusClass = '';
        let actionButtons = '';
        
        // Set status class and action buttons based on status
        switch (request.status) {
            case 'approved':
                statusClass = 'success';
                break;
            case 'rejected':
                statusClass = 'danger';
                break;
            case 'pending':
                statusClass = 'warning';
                actionButtons = `
                    <button class="btn-action approve" data-id="${request.id}">Approve</button>
                    <button class="btn-action reject" data-id="${request.id}">Reject</button>
                `;
                break;
        }
        
        html += `
            <tr>
                <td>${request.name}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${request.reason}</td>
                <td><span class="status-badge ${statusClass}">${request.status}</span></td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
    
    allLeaveRequestsTable.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('#all-leave-requests-table .btn-action').forEach(btn => {
        btn.addEventListener('click', handleLeaveAction);
    });
}

// Filter leave requests by status
function filterLeaveRequests() {
    const statusFilter = document.getElementById('leave-status-filter').value;
    
    let filtered = [...allLeaveRequests];
    
    // Filter by status
    if (statusFilter) {
        filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    // Display filtered leave requests
    displayAllLeaveRequests(filtered);
}

// Load branches
function loadBranches() {
    // In a real application, you would fetch this from the server
    // For this example, we'll use hardcoded data
    branchesList.innerHTML = '<div class="loading">Loading branches...</div>';
    
    // Simulated API call - in a real app, replace with actual endpoint
    setTimeout(() => {
        allBranches = {
            branch1: { name: "Headquarters", location: "New York" },
            branch2: { name: "Downtown Office", location: "Chicago" },
            branch3: { name: "West Coast", location: "San Francisco" }
        };
        displayBranches();
    }, 500);
}

// Display branches in settings tab
function displayBranches() {
    if (Object.keys(allBranches).length === 0) {
        branchesList.innerHTML = '<div class="no-data">No branches found.</div>';
        return;
    }
    
    let html = '';
    for (const [branchId, branch] of Object.entries(allBranches)) {
        html += `
            <div class="settings-item">
                <div class="settings-item-main">
                    <div class="settings-item-name">${branch.name}</div>
                    <div class="settings-item-detail">${branch.location}</div>
                </div>
                <div class="settings-item-actions">
                    <button class="btn-action delete" data-id="${branchId}">Delete</button>
                </div>
            </div>
        `;
    }
    
    branchesList.innerHTML = html;
    
    // Add event listeners to delete buttons
    document.querySelectorAll('#branches-list .btn-action.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const branchId = this.getAttribute('data-id');
            if (confirm(`Are you sure you want to delete branch: ${allBranches[branchId].name}?`)) {
                deleteBranch(branchId);
            }
        });
    });
}

// Add new branch
function addBranch() {
    const branchName = document.getElementById('branch-name').value;
    const branchLocation = document.getElementById('branch-location').value;
    
    if (!branchName || !branchLocation) {
        alert('Please fill in all branch details.');
        return;
    }
    
    // In a real application, you would send this to the server
    // For this example, we'll just update the local data
    const branchId = `branch${Object.keys(allBranches).length + 1}`;
    allBranches[branchId] = {
        name: branchName,
        location: branchLocation,
        isNew: true // Flag to indicate this is newly added
    };
    
    // Update UI
    displayBranches();
    
    // Update all branch selectors/dropdowns throughout the app
    updateBranchSelectors();
    
    // Send message to staff portal (in a real app using websockets or similar)
    sendUpdateToStaffPortal('branch', { id: branchId, name: branchName, location: branchLocation });
    
    // Reset form
    document.getElementById('branch-name').value = '';
    document.getElementById('branch-location').value = '';
    
    // Show success message
    alert('Branch added successfully.');
}

// Delete branch
function deleteBranch(branchId) {
    // In a real application, you would send this to the server
    // For this example, we'll just update the local data
    const branchName = allBranches[branchId].name;
    delete allBranches[branchId];
    
    // Update UI
    displayBranches();
    
    // Update all branch selectors/dropdowns throughout the app
    updateBranchSelectors();
    
    // Send message to staff portal (in a real app using websockets or similar)
    sendUpdateToStaffPortal('branch-delete', { id: branchId, name: branchName });
    
    // Show success message
    alert('Branch deleted successfully.');
}

// Update all branch selectors/dropdowns throughout the app
function updateBranchSelectors() {
    // Update any branch dropdowns or selectors
    const branchSelectors = document.querySelectorAll('.branch-selector');
    
    if (branchSelectors.length > 0) {
        branchSelectors.forEach(selector => {
            // Store current selection if it exists
            const currentSelection = selector.value;
            
            // Clear existing options except the default "Select branch" option
            while (selector.options.length > 1) {
                selector.remove(1);
            }
            
            // Add options for each branch
            for (const [branchId, branch] of Object.entries(allBranches)) {
                const option = document.createElement('option');
                option.value = branchId;
                option.textContent = branch.name;
                // Highlight newly added branches
                if (branch.isNew) {
                    option.classList.add('newly-added-option');
                    // Remove the flag after adding
                    setTimeout(() => {
                        branch.isNew = false;
                        option.classList.remove('newly-added-option');
                    }, 3000);
                }
                selector.appendChild(option);
            }
            
            // Restore selection if it still exists
            if (currentSelection && [...selector.options].some(opt => opt.value === currentSelection)) {
                selector.value = currentSelection;
            }
        });
    }
    
    // Also update branch filter in shifts tab
    const branchFilter = document.getElementById('branch-filter');
    if (branchFilter) {
        // Store current selection
        const currentSelection = branchFilter.value;
        
        // Clear existing options except the default "All branches" option
        while (branchFilter.options.length > 1) {
            branchFilter.remove(1);
        }
        
        // Add options for each branch
        for (const [branchId, branch] of Object.entries(allBranches)) {
            const option = document.createElement('option');
            option.value = branch.name;
            option.textContent = branch.name;
            branchFilter.appendChild(option);
        }
        
        // Restore selection if possible
        if (currentSelection && [...branchFilter.options].some(opt => opt.value === currentSelection)) {
            branchFilter.value = currentSelection;
        }
    }
    
    // Update branch filter in insights tab if it exists
    if (insightsBranchFilter) {
        // Store current selection
        const currentSelection = insightsBranchFilter.value;
        
        // Clear existing options except the default "All branches" option
        while (insightsBranchFilter.options.length > 1) {
            insightsBranchFilter.remove(1);
        }
        
        // Add options for each branch
        for (const [branchId, branch] of Object.entries(allBranches)) {
            const option = document.createElement('option');
            option.value = branch.name;
            option.textContent = branch.name;
            insightsBranchFilter.appendChild(option);
        }
        
        // Restore selection if possible
        if (currentSelection && [...insightsBranchFilter.options].some(opt => opt.value === currentSelection)) {
            insightsBranchFilter.value = currentSelection;
        }
    }
}

// Load roles
function loadRoles() {
    // In a real application, you would fetch this from the server
    // For this example, we'll use hardcoded data
    rolesList.innerHTML = '<div class="loading">Loading roles...</div>';
    
    // Simulated API call - in a real app, replace with actual endpoint
    setTimeout(() => {
        allRoles = {
            manager: { name: "Manager" },
            supervisor: { name: "Supervisor" },
            associate: { name: "Associate" }
        };
        displayRoles();
    }, 500);
}

// Display roles in settings tab
function displayRoles() {
    if (Object.keys(allRoles).length === 0) {
        rolesList.innerHTML = '<div class="no-data">No roles found.</div>';
        return;
    }
    
    let html = '';
    for (const [roleId, role] of Object.entries(allRoles)) {
        html += `
            <div class="settings-item">
                <div class="settings-item-main">
                    <div class="settings-item-name">${role.name}</div>
                </div>
                <div class="settings-item-actions">
                    <button class="btn-action delete" data-id="${roleId}">Delete</button>
                </div>
            </div>
        `;
    }
    
    rolesList.innerHTML = html;
    
    // Add event listeners to delete buttons
    document.querySelectorAll('#roles-list .btn-action.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const roleId = this.getAttribute('data-id');
            if (confirm(`Are you sure you want to delete role: ${allRoles[roleId].name}?`)) {
                deleteRole(roleId);
            }
        });
    });
}

// Add new role
function addRole() {
    const roleName = document.getElementById('role-name').value;
    
    if (!roleName) {
        alert('Please enter a role name.');
        return;
    }
    
    // In a real application, you would send this to the server
    // For this example, we'll just update the local data
    const roleId = roleName.toLowerCase().replace(/\s+/g, '_');
    allRoles[roleId] = {
        name: roleName,
        isNew: true // Flag to indicate this is newly added
    };
    
    // Update UI
    displayRoles();
    
    // Update all role selectors/dropdowns throughout the app
    updateRoleSelectors();
    
    // Send message to staff portal (in a real app using websockets or similar)
    sendUpdateToStaffPortal('role', { id: roleId, name: roleName });
    
    // Reset form
    document.getElementById('role-name').value = '';
    
    // Show success message
    alert('Role added successfully.');
}

// Delete role
function deleteRole(roleId) {
    // In a real application, you would send this to the server
    // For this example, we'll just update the local data
    const roleName = allRoles[roleId].name;
    delete allRoles[roleId];
    
    // Update UI
    displayRoles();
    
    // Update all role selectors/dropdowns throughout the app
    updateRoleSelectors();
    
    // Send message to staff portal (in a real app using websockets or similar)
    sendUpdateToStaffPortal('role-delete', { id: roleId, name: roleName });
    
    // Show success message
    alert('Role deleted successfully.');
}

// Update all role selectors/dropdowns throughout the app
function updateRoleSelectors() {
    // Update any role dropdowns or selectors
    const roleSelectors = document.querySelectorAll('.role-selector');
    
    if (roleSelectors.length > 0) {
        roleSelectors.forEach(selector => {
            // Store current selection if it exists
            const currentSelection = selector.value;
            
            // Clear existing options except the default "Select role" option
            while (selector.options.length > 1) {
                selector.remove(1);
            }
            
            // Add options for each role
            for (const [roleId, role] of Object.entries(allRoles)) {
                const option = document.createElement('option');
                option.value = roleId;
                option.textContent = role.name;
                // Highlight newly added roles
                if (role.isNew) {
                    option.classList.add('newly-added-option');
                    // Remove the flag after adding
                    setTimeout(() => {
                        role.isNew = false;
                        option.classList.remove('newly-added-option');
                    }, 3000);
                }
                selector.appendChild(option);
            }
            
            // Restore selection if it still exists
            if (currentSelection && [...selector.options].some(opt => opt.value === currentSelection)) {
                selector.value = currentSelection;
            }
        });
    }
    
    // Also update staff role selector in add/edit staff modal
    const staffRoleSelector = document.getElementById('staff-role');
    if (staffRoleSelector) {
        // Store current selection
        const currentSelection = staffRoleSelector.value;
        
        // Clear existing options except default options like 'admin' and 'staff'
        const defaultOptions = ['admin', 'staff'];
        
        // Filter out options that aren't default
        Array.from(staffRoleSelector.options).forEach(option => {
            if (!defaultOptions.includes(option.value)) {
                staffRoleSelector.removeChild(option);
            }
        });
        
        // Add options for each role
        for (const [roleId, role] of Object.entries(allRoles)) {
            // Skip if it's already a default role
            if (defaultOptions.includes(roleId)) continue;
            
            const option = document.createElement('option');
            option.value = roleId;
            option.textContent = role.name;
            staffRoleSelector.appendChild(option);
        }
        
        // Restore selection if possible
        if (currentSelection && [...staffRoleSelector.options].some(opt => opt.value === currentSelection)) {
            staffRoleSelector.value = currentSelection;
        }
    }
}

// Refresh data
function refreshData() {
    loadDashboardData();
    
    // Refresh other data based on active tab
    const activeTab = document.querySelector('.admin-sidebar nav ul li.active').getAttribute('data-tab');
    
    switch (activeTab) {
        case 'staff':
            loadStaff();
            break;
        case 'shifts':
            loadShifts();
            loadShiftChangeRequests();  // Add this to load shift change requests
            break;
        case 'leave':
            loadLeaveRequests();
            break;
        case 'settings':
            loadBranches();
            loadRoles();
            break;
    }
}

// Load shift change requests
function loadShiftChangeRequests() {
    const shiftSwapRequestsTable = document.getElementById('shift-swap-requests-table');
    if (!shiftSwapRequestsTable) return;
    
    shiftSwapRequestsTable.innerHTML = '<tr><td colspan="7" class="loading-cell">Loading shift change requests...</td></tr>';
    
    fetch('/get_shift_change_requests')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allShiftChangeRequests = data.shift_change_requests;
                displayShiftChangeRequests(allShiftChangeRequests);
                
                // Set up filter for shift change requests
                const swapStatusFilter = document.getElementById('swap-status-filter');
                if (swapStatusFilter) {
                    swapStatusFilter.addEventListener('change', filterShiftChangeRequests);
                }
            } else {
                shiftSwapRequestsTable.innerHTML = '<tr><td colspan="7" class="loading-cell">Error loading shift change requests.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            shiftSwapRequestsTable.innerHTML = '<tr><td colspan="7" class="loading-cell">Error loading shift change requests.</td></tr>';
        });
}

// Display shift change requests
function displayShiftChangeRequests(requests) {
    const shiftSwapRequestsTable = document.getElementById('shift-swap-requests-table');
    if (!shiftSwapRequestsTable) return;
    
    if (requests.length === 0) {
        shiftSwapRequestsTable.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">No shift change requests found.</td>
            </tr>
        `;
        return;
    }
    
    // Sort requests by submission date (most recent first)
    requests.sort((a, b) => new Date(b.submitted_on) - new Date(a.submitted_on));
    
    let html = '';
    requests.forEach(request => {
        // Format shift details
        const requestingShiftInfo = request.shift_details ? 
            `${request.shift_details.date}<br>${request.shift_details.time}<br>${request.shift_details.branch}` : 
            'N/A';
        
        const targetShiftInfo = request.target_shift_details ? 
            `${request.target_shift_details.date}<br>${request.target_shift_details.time}<br>${request.target_shift_details.branch}` : 
            'Not specified';
        
        let statusClass = '';
        let statusText = request.status;
        let actionButtons = '';
        
        // Set status class and action buttons based on status
        switch (request.status) {
            case 'approved':
                statusClass = 'success';
                statusText = 'Approved';
                break;
            case 'rejected_by_admin':
                statusClass = 'danger';
                statusText = 'Rejected by Admin';
                break;
            case 'rejected_by_staff':
                statusClass = 'danger';
                statusText = 'Rejected by Staff';
                break;
            case 'awaiting_admin':
                statusClass = 'warning';
                statusText = 'Awaiting Admin Approval';
                actionButtons = `
                    <button class="btn-action approve" data-id="${request.id}">Approve</button>
                    <button class="btn-action reject" data-id="${request.id}">Reject</button>
                `;
                break;
            case 'pending':
                statusClass = 'warning';
                statusText = 'Awaiting Staff Response';
                break;
        }
        
        html += `
            <tr>
                <td>${request.requesting_name}</td>
                <td>${requestingShiftInfo}</td>
                <td>${request.target_name}</td>
                <td>${targetShiftInfo}</td>
                <td>${request.reason}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
    
    shiftSwapRequestsTable.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('#shift-swap-requests-table .btn-action').forEach(btn => {
        btn.addEventListener('click', handleShiftChangeAction);
    });
}

// Filter shift change requests by status
function filterShiftChangeRequests() {
    const statusFilter = document.getElementById('swap-status-filter').value;
    
    let filtered = [...allShiftChangeRequests];
    
    // Filter by status
    if (statusFilter) {
        if (statusFilter === 'pending') {
            // Include both pending and awaiting_admin
            filtered = filtered.filter(request => 
                request.status === 'pending' || request.status === 'awaiting_admin'
            );
        } else {
            filtered = filtered.filter(request => {
                if (statusFilter === 'approved') {
                    return request.status === 'approved';
                } else if (statusFilter === 'rejected') {
                    return request.status === 'rejected_by_admin' || request.status === 'rejected_by_staff';
                }
                return true;
            });
        }
    }
    
    // Display filtered shift change requests
    displayShiftChangeRequests(filtered);
}

// Handle shift change request approval/rejection
function handleShiftChangeAction(e) {
    const requestId = e.target.getAttribute('data-id');
    const approve = e.target.classList.contains('approve');
    
    const data = {
        request_id: requestId,
        approve: approve
    };
    
    fetch('/approve_shift_change', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Refresh shift change requests data
            loadShiftChangeRequests();
            alert(`Shift change request has been ${approve ? 'approved' : 'rejected'}.`);
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing the shift change request.');
    });
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

// Handle photo upload
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            staffPhotoPreviewImg.src = e.target.result;
            photoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Remove photo
function removePhoto() {
    staffPhotoInput.value = '';
    staffPhotoPreviewImg.src = '';
    photoPreview.style.display = 'none';
}

// Load notifications
function loadNotifications() {
    // In a real app, fetch notifications from the server
    // For this example, we'll use static data
    
    notifications = [
        {
            id: '1',
            title: 'New Leave Request',
            message: 'John Doe has requested leave from April 20, 2025 to April 25, 2025.',
            time: '2 hours ago',
            type: 'leave-request',
            status: 'unread',
            actions: ['read']
        },
        {
            id: '2',
            title: 'Late Check-in Alert',
            message: 'Jane Smith is 30 minutes late for her shift at Headquarters.',
            time: '5 hours ago',
            type: 'late-check-in',
            status: 'unread',
            actions: ['read']
        },
        {
            id: '3',
            title: 'Shift Change Request',
            message: 'Michael Brown requested to swap shifts with Sarah Johnson on April 18, 2025.',
            time: '1 day ago',
            type: 'shift-change',
            status: 'unread',
            actions: ['approve', 'reject', 'read']
        },
        {
            id: '4',
            title: 'System Update',
            message: 'Shift Q has been updated to version 2.3. Check out the new features!',
            time: '3 days ago',
            type: 'system',
            status: 'read',
            actions: []
        }
    ];
    
    // Count unread notifications
    updateUnreadCount();
    
    // Display notifications
    displayNotifications(notifications);
}

// Display notifications
function displayNotifications(notificationsToDisplay) {
    if (!notificationList) return;
    
    if (notificationsToDisplay.length === 0) {
        notificationList.innerHTML = `
            <div class="notification-item">
                <div class="notification-content">
                    <div class="notification-message">No notifications to display.</div>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    notificationsToDisplay.forEach(notification => {
        let actionButtons = '';
        
        if (notification.actions.includes('approve') && notification.status === 'unread') {
            actionButtons += `
                <button class="btn-action approve" data-id="${notification.id}" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
            `;
        }
        
        if (notification.actions.includes('reject') && notification.status === 'unread') {
            actionButtons += `
                <button class="btn-action reject" data-id="${notification.id}" title="Reject">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
        
        if (notification.actions.includes('read') && notification.status === 'unread') {
            actionButtons += `
                <button class="btn-action read-notification" data-id="${notification.id}" title="Mark as read">
                    <i class="fas fa-${notification.actions.includes('approve') ? 'ellipsis-v' : 'check'}"></i>
                </button>
            `;
        }
        
        html += `
            <div class="notification-item ${notification.status === 'unread' ? 'unread' : ''}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
                <div class="notification-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    });
    
    notificationList.innerHTML = html;
}

// Get appropriate icon for notification type
function getNotificationIcon(type) {
    switch (type) {
        case 'leave-request': return 'calendar-alt';
        case 'late-check-in': return 'exclamation-triangle';
        case 'shift-change': return 'exchange-alt';
        case 'system': return 'cog';
        default: return 'bell';
    }
}

// Mark notification as read
function markAsRead(notificationId) {
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
        notifications[index].status = 'read';
        
        // Update UI
        updateUnreadCount();
        displayNotifications(filterNotificationsByStatus(notificationFilter.value));
    }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
        notification.status = 'read';
    });
    
    // Update UI
    updateUnreadCount();
    displayNotifications(filterNotificationsByStatus(notificationFilter.value));
}

// Filter notifications by status
function filterNotifications() {
    const status = notificationFilter.value;
    const filteredNotifications = filterNotificationsByStatus(status);
    displayNotifications(filteredNotifications);
}

// Helper function to filter notifications by status
function filterNotificationsByStatus(status) {
    if (status === 'unread') {
        return notifications.filter(n => n.status === 'unread');
    } else if (status === 'read') {
        return notifications.filter(n => n.status === 'read');
    } else {
        return notifications;
    }
}

// Update unread count badge
function updateUnreadCount() {
    unreadCount = notifications.filter(n => n.status === 'unread').length;
    
    if (notificationBadge) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
}

// Approve notification
function approveNotification(notificationId) {
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
        // In a real app, send approval to server
        
        // For this example, just mark as read and show success message
        notifications[index].status = 'read';
        notifications[index].message += ' (Approved)';
        
        // Update UI
        updateUnreadCount();
        displayNotifications(filterNotificationsByStatus(notificationFilter.value));
        
        alert('Request approved successfully!');
    }
}

// Reject notification
function rejectNotification(notificationId) {
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
        // In a real app, send rejection to server
        
        // For this example, just mark as read and show message
        notifications[index].status = 'read';
        notifications[index].message += ' (Rejected)';
        
        // Update UI
        updateUnreadCount();
        displayNotifications(filterNotificationsByStatus(notificationFilter.value));
        
        alert('Request rejected.');
    }
}

// INSIGHTS DASHBOARD FUNCTIONALITY

// Set up charts
function setupCharts() {
    if (!window.Chart) {
        // Load Chart.js dynamically if not available
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = initializeCharts;
        document.head.appendChild(script);
    } else {
        initializeCharts();
    }
}

// Initialize all charts
function initializeCharts() {
    if (window.Chart) {
        initializeAttendanceChart();
        initializeShiftDistributionChart();
        initializeLeaveAnalysisChart();
    }
}

// Initialize attendance chart
function initializeAttendanceChart() {
    if (!attendanceChart) return;
    
    const ctx = attendanceChart.getContext('2d');
    
    // Sample data - in a real app, this would come from the server
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const presentData = [45, 42, 47, 43, 40, 35, 30];
    const absentData = [3, 5, 2, 4, 7, 4, 2];
    const lateData = [7, 8, 6, 8, 8, 6, 3];
    
    window.attendanceChartObj = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Present',
                    data: presentData,
                    backgroundColor: 'rgba(76, 110, 245, 0.2)',
                    borderColor: 'rgba(76, 110, 245, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Late',
                    data: lateData,
                    backgroundColor: 'rgba(253, 126, 20, 0.2)',
                    borderColor: 'rgba(253, 126, 20, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Absent',
                    data: absentData,
                    backgroundColor: 'rgba(250, 82, 82, 0.2)',
                    borderColor: 'rgba(250, 82, 82, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Staff'
                    }
                }
            }
        }
    });
}

// Initialize shift distribution chart
function initializeShiftDistributionChart() {
    if (!shiftDistributionChart) return;
    
    const ctx = shiftDistributionChart.getContext('2d');
    
    // Sample data
    const data = {
        labels: ['Morning Shift', 'Day Shift', 'Evening Shift', 'Night Shift'],
        datasets: [{
            data: [30, 25, 20, 15],
            backgroundColor: [
                'rgba(76, 110, 245, 0.7)',
                'rgba(64, 192, 87, 0.7)',
                'rgba(253, 126, 20, 0.7)',
                'rgba(153, 102, 255, 0.7)'
            ],
            borderColor: [
                'rgba(76, 110, 245, 1)',
                'rgba(64, 192, 87, 1)',
                'rgba(253, 126, 20, 1)',
                'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    window.shiftChartObj = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.formattedValue;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Initialize leave analysis chart
function initializeLeaveAnalysisChart() {
    if (!leaveAnalysisChart) return;
    
    const ctx = leaveAnalysisChart.getContext('2d');
    
    // Sample data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sickLeaveData = [5, 3, 7, 6, 4, 8, 10, 9, 6, 7, 4, 8];
    const vacationData = [2, 4, 8, 6, 5, 12, 15, 14, 7, 3, 2, 7];
    const otherLeaveData = [1, 2, 0, 3, 1, 2, 3, 2, 4, 1, 0, 2];
    
    window.leaveChartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Sick Leave',
                    data: sickLeaveData,
                    backgroundColor: 'rgba(250, 82, 82, 0.7)',
                    borderColor: 'rgba(250, 82, 82, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Vacation',
                    data: vacationData,
                    backgroundColor: 'rgba(64, 192, 87, 0.7)',
                    borderColor: 'rgba(64, 192, 87, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Other',
                    data: otherLeaveData,
                    backgroundColor: 'rgba(253, 126, 20, 0.7)',
                    borderColor: 'rgba(253, 126, 20, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Days'
                    }
                }
            }
        }
    });
}

// Update all charts based on selected filters
function updateAllCharts() {
    const period = insightsPeriodFilter.value;
    const branch = insightsBranchFilter.value;
    
    // In a real app, fetch fresh data from server based on period and branch
    // For this example, just update with some randomized variations
    
    // Update attendance chart
    if (window.attendanceChartObj) {
        const factor = period === 'week' ? 0.8 : period === 'month' ? 1 : period === 'quarter' ? 1.1 : 1.2;
        const variance = branch ? 0.9 : 1;
        
        window.attendanceChartObj.data.datasets[0].data = [45, 42, 47, 43, 40, 35, 30].map(v => 
            Math.round(v * factor * variance * (0.9 + Math.random() * 0.2))
        );
        window.attendanceChartObj.data.datasets[1].data = [7, 8, 6, 8, 8, 6, 3].map(v => 
            Math.round(v * factor * variance * (0.9 + Math.random() * 0.2))
        );
        window.attendanceChartObj.data.datasets[2].data = [3, 5, 2, 4, 7, 4, 2].map(v => 
            Math.round(v * factor * variance * (0.9 + Math.random() * 0.2))
        );
        window.attendanceChartObj.update();
    }
    
    // Update shift distribution
    if (window.shiftChartObj) {
        const shiftData = [30, 25, 20, 15].map(v => 
            Math.round(v * (0.9 + Math.random() * 0.2))
        );
        window.shiftChartObj.data.datasets[0].data = shiftData;
        window.shiftChartObj.update();
    }
    
    // Update leave chart
    if (window.leaveChartObj) {
        const leaveData1 = [5, 3, 7, 6, 4, 8, 10, 9, 6, 7, 4, 8].map(v => 
            Math.round(v * (0.9 + Math.random() * 0.2))
        );
        const leaveData2 = [2, 4, 8, 6, 5, 12, 15, 14, 7, 3, 2, 7].map(v => 
            Math.round(v * (0.9 + Math.random() * 0.2))
        );
        const leaveData3 = [1, 2, 0, 3, 1, 2, 3, 2, 4, 1, 0, 2].map(v => 
            Math.round(v * (0.9 + Math.random() * 0.2))
        );
        
        window.leaveChartObj.data.datasets[0].data = leaveData1;
        window.leaveChartObj.data.datasets[1].data = leaveData2;
        window.leaveChartObj.data.datasets[2].data = leaveData3;
        window.leaveChartObj.update();
    }
    
    // Update performance table data
    updatePerformanceTable(period, branch);
}

// Update performance table
function updatePerformanceTable(period, branch) {
    if (!performanceTable) return;
    
    // In a real app, fetch this data from server
    // For this example, we'll just generate some data
    
    let html = '';
    const staffData = [
        { name: 'John Doe', punctuality: 95, attendance: 98, hours: '176/168', performance: 'Excellent' },
        { name: 'Jane Smith', punctuality: 87, attendance: 92, hours: '162/168', performance: 'Good' },
        { name: 'Michael Brown', punctuality: 75, attendance: 85, hours: '152/168', performance: 'Average' },
        { name: 'Sarah Johnson', punctuality: 93, attendance: 90, hours: '166/168', performance: 'Good' },
        { name: 'David Wilson', punctuality: 65, attendance: 78, hours: '145/168', performance: 'Needs Improvement' }
    ];
    
    if (branch) {
        // Filter by branch in real app
        // For this example, just show fewer staff members
        staffData.length = 3;
    }
    
    staffData.forEach(staff => {
        let performanceClass = 'average';
        
        switch (staff.performance) {
            case 'Excellent': performanceClass = 'excellent'; break;
            case 'Good': performanceClass = 'good'; break;
            case 'Average': performanceClass = 'average'; break;
            case 'Needs Improvement': performanceClass = 'needs-improvement'; break;
        }
        
        html += `
            <tr>
                <td>${staff.name}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${staff.punctuality}%; background-color: ${getColorForPercentage(staff.punctuality)};"></div>
                        <span>${staff.punctuality}%</span>
                    </div>
                </td>
                <td>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${staff.attendance}%; background-color: ${getColorForPercentage(staff.attendance)};"></div>
                        <span>${staff.attendance}%</span>
                    </div>
                </td>
                <td>${staff.hours}</td>
                <td><span class="performance-badge ${performanceClass}">${staff.performance}</span></td>
            </tr>
        `;
    });
    
    performanceTable.innerHTML = html;
}

// Helper function to get color based on percentage
function getColorForPercentage(percentage) {
    if (percentage >= 90) return '#40c057'; // Green
    if (percentage >= 80) return '#69db7c'; // Light green
    if (percentage >= 70) return '#fcc419'; // Yellow
    if (percentage >= 60) return '#fd7e14'; // Orange
    return '#fa5252'; // Red
}

// Send updates to staff portal using websockets or similar technology
function sendUpdateToStaffPortal(updateType, data) {
    // In a real application, this would use WebSockets or Server-Sent Events
    // For this example, we'll use localStorage as a simple way to communicate between tabs
    // In production, you would implement proper WebSocket communication
    
    const updateData = {
        type: updateType,
        data: data,
        timestamp: new Date().toISOString()
    };
    
    // Store the update in localStorage - in a real app this would be WebSocket communication
    localStorage.setItem('staff_portal_update', JSON.stringify(updateData));
    
    // Dispatch custom event to notify other tabs/windows
    const updateEvent = new CustomEvent('staff-portal-update', { 
        detail: updateData 
    });
    window.dispatchEvent(updateEvent);
    
    console.log(`Update sent to staff portal: ${updateType}`, data);
}

// Initialize chat functionality
function initializeChat() {
    if (!chatBtn || !chatModal) return;
    
    chatBtn.addEventListener('click', function() {
        chatModal.style.display = 'flex';
        chatNotification.style.display = 'none';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Mark messages as read when chat is opened
        localStorage.setItem('lastChatReadTime', new Date().toISOString());
        updateChatUnreadCount();
    });

    closeChatBtn.addEventListener('click', function() {
        chatModal.style.display = 'none';
    });

    sendChatBtn.addEventListener('click', sendChatMessage);
    
    // Add the clear chat button functionality
    const clearChatBtn = document.getElementById('clear-chat-btn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearChatMessages);
    }
    
    // Add the emoji button functionality
    const emojiBtn = document.getElementById('emoji-btn');
    if (emojiBtn) {
        emojiBtn.addEventListener('click', toggleEmojiPicker);
    }
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
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
    loadChatTeamMembers();
    
    // Check for new messages periodically (every 5 seconds)
    setInterval(checkForNewChatMessages, 5000);
    
    // Add seed messages if chat is empty
    addSeedMessagesIfEmpty();
    
    // Initial unread count update
    updateChatUnreadCount();
    
    // Create emoji picker if it doesn't exist
    createEmojiPicker();
}

// Toggle emoji picker
function toggleEmojiPicker(show) {
    const emojiPicker = document.getElementById('emoji-picker');
    if (!emojiPicker) return;
    
    if (show === undefined) {
        // Toggle current state
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'flex' : 'none';
    } else {
        // Set to specified state
        emojiPicker.style.display = show ? 'flex' : 'none';
    }
}

// Insert emoji into chat input
function insertEmoji(emoji) {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;
    
    // Get cursor position
    const startPos = chatInput.selectionStart;
    const endPos = chatInput.selectionEnd;
    
    // Insert emoji at cursor position
    const before = chatInput.value.substring(0, startPos);
    const after = chatInput.value.substring(endPos, chatInput.value.length);
    chatInput.value = before + emoji + after;
    
    // Move cursor after inserted emoji
    chatInput.selectionStart = chatInput.selectionEnd = startPos + emoji.length;
    
    // Focus back on input
    chatInput.focus();
}

// Handle photo upload
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image/*')) {
        alert('Please select an image file');
        return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image file size should not exceed 5MB');
        return;
    }

    // Create a FileReader to read the file
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result; // This is the base64 data URL
        
        // Create message object with photo
        const msgObj = {
            id: generateUniqueId(),
            sender: "Admin",
            role: 'admin',
            type: 'photo',
            media: imageData,
            timestamp: new Date().toISOString()
        };
        
        // Add to UI
        addMessageToChatDisplay(msgObj);
        
        // Store in local storage
        storeChatMessageToLocalStorage(msgObj);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    
    // Read the file as a data URL (base64)
    reader.readAsDataURL(file);
    
    // Reset the file input
    event.target.value = '';
}

// Send a chat message
function sendChatMessage() {
    const messageText = chatInput.value.trim();
    if (!messageText) return;
    
    // In a real app, get the current user's name from session
    // Here we're using "Admin" as the sender name
    const userName = "Admin";
    
    // Create message object
    const msgObj = {
        id: generateUniqueId(),
        sender: userName,
        role: 'admin',
        text: messageText,
        timestamp: new Date().toISOString(),
        type: 'text'
    };
    
    // Add to UI
    addMessageToChatDisplay(msgObj);
    
    // Store in local storage for persistence and cross-user sharing
    storeChatMessageToLocalStorage(msgObj);
    
    // Clear input
    chatInput.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate a unique ID for messages
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Add message to chat display
function addMessageToChatDisplay(msgObj) {
    const messageElement = document.createElement('div');
    const isCurrentUser = msgObj.role === 'admin';
    
    messageElement.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
    
    const time = new Date(msgObj.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    if (msgObj.type === 'text') {
        messageElement.innerHTML = `
            <div class="message-bubble">${msgObj.text}</div>
            <div class="message-info">${isCurrentUser ? 'You' : `<span class="online-status"></span> ${msgObj.sender}`} • ${time}</div>
        `;
    } else if (msgObj.type === 'photo') {
        messageElement.innerHTML = `
            <div class="message-bubble"><img src="${msgObj.media}" alt="Shared photo" class="message-media" onclick="window.open(this.src)"></div>
            <div class="message-info">${isCurrentUser ? 'You' : `<span class="online-status"></span> ${msgObj.sender}`} • ${time}</div>
        `;
    }
    
    chatMessages.appendChild(messageElement);
}

// Store chat message in local storage
function storeChatMessageToLocalStorage(msgObj) {
    // Get existing messages
    let messages = JSON.parse(localStorage.getItem('teamChatMessages') || '[]');
    
    // Add new message
    messages.push(msgObj);
    
    // Keep only last 100 messages
    if (messages.length > 100) {
        messages = messages.slice(messages.length - 100);
    }
    
    // Store back in localStorage
    localStorage.setItem('teamChatMessages', JSON.stringify(messages));
    
    // Update last modification time for this session
    localStorage.setItem('teamChatLastModified', new Date().toISOString());
}

// Load chat history from local storage
function loadChatHistory() {
    const messages = JSON.parse(localStorage.getItem('teamChatMessages') || '[]');
    
    if (messages.length > 0) {
        chatMessages.innerHTML = '';
        
        messages.forEach(msgObj => {
            addMessageToChatDisplay(msgObj);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Check for new messages that may have been added by other users
function checkForNewChatMessages() {
    const lastModified = localStorage.getItem('teamChatLastModified') || '0';
    const lastCheck = localStorage.getItem('teamChatLastCheck') || '0';
    
    // Only update if there's been a change since our last check
    if (lastModified > lastCheck) {
        // Reload chat history
        loadChatHistory();
        
        // Update unread count
        updateChatUnreadCount();
        
        // Update last check time
        localStorage.setItem('teamChatLastCheck', new Date().toISOString());
    }
}

// Update unread count for notification badge
function updateChatUnreadCount() {
    const lastReadTime = localStorage.getItem('lastChatReadTime') || '0';
    const messages = JSON.parse(localStorage.getItem('teamChatMessages') || '[]');
    
    // Consider messages unread if:
    // 1. They are newer than the last time the user had the chat open
    // 2. They were not sent by the current user (admin)
    const unreadMessages = messages.filter(msg => 
        msg.timestamp > lastReadTime && msg.role !== 'admin'
    );
    
    const count = unreadMessages.length;
    
    if (count > 0 && chatModal.style.display !== 'flex') {
        chatNotification.style.display = 'flex';
        chatNotification.textContent = count;
    } else {
        chatNotification.style.display = 'none';
    }
}

// Load team members for chat
function loadChatTeamMembers() {
    if (!membersList) return;
    
    // In a real app, this would come from the server
    // For this demo, we'll use staff from our global allStaff array
    const members = allStaff.map(staff => {
        return {
            id: staff.username,
            name: staff.name,
            status: Math.random() > 0.3 ? 'online' : 'offline', // Randomly set status for demo
            initial: getInitialsFromName(staff.name)
        };
    });
    
    // Add admin/manager
    members.unshift({
        id: 'admin',
        name: 'Admin',
        status: 'online',
        initial: 'A'
    });
    
    // Sort - online users first, then alphabetically
    members.sort((a, b) => {
        if (a.status === b.status) {
            return a.name.localeCompare(b.name);
        }
        return a.status === 'online' ? -1 : 1;
    });
    
    let html = '';
    
    members.forEach(member => {
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

// Helper function to get initials from name
function getInitialsFromName(name) {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substr(0, 2);
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
                id: 'seed-1',
                sender: 'Admin',
                role: 'admin',
                text: 'Welcome to the Shift Q Team Chat! 👋',
                timestamp: yesterday.toISOString(),
                type: 'text'
            },
            {
                id: 'seed-2',
                sender: 'Admin',
                role: 'admin',
                text: 'This is where we can all communicate about shifts, leave requests, and general team updates.',
                timestamp: yesterday.toISOString(),
                type: 'text'
            },
            {
                id: 'seed-3',
                sender: 'John Doe',
                role: 'staff',
                text: 'Hey everyone! Looking forward to working with you all!',
                timestamp: yesterday.toISOString(),
                type: 'text'
            },
            {
                id: 'seed-4',
                sender: 'Jane Smith',
                role: 'staff',
                text: 'Good morning team, I\'ll be at the downtown branch today if anyone needs help.',
                timestamp: now.toISOString(),
                type: 'text'
            }
        ];
        
        localStorage.setItem('teamChatMessages', JSON.stringify(seedMessages));
        localStorage.setItem('teamChatLastModified', now.toISOString());
        loadChatHistory();
    }
}

// Clear all chat messages
function clearChatMessages() {
    if (confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
        // Clear chat messages from display
        chatMessages.innerHTML = '';
        
        // Clear messages from local storage
        localStorage.removeItem('teamChatMessages');
        
        // Add a system message indicating the chat was cleared
        const clearMsg = {
            id: generateUniqueId(),
            sender: 'System',
            role: 'system',
            text: 'Chat history has been cleared by Admin.',
            timestamp: new Date().toISOString(),
            type: 'text'
        };
        
        // Add to UI
        addMessageToChatDisplay(clearMsg);
        
        // Store in local storage
        storeChatMessageToLocalStorage(clearMsg);
        
        // Update last modification time
        localStorage.setItem('teamChatLastModified', new Date().toISOString());
        
        // Show success message
        alert('Chat history has been cleared.');
    }
}

// Initialize late employee monitoring
function initializeLateEmployeeMonitoring() {
    // Create late employee table and section if it doesn't exist yet
    createLateEmployeeSection();
    
    // Start monitoring for late employees
    startLateEmployeeMonitoring();
    
    // Load existing late employees
    loadLateEmployees();
    
    // Load warning history
    loadWarningHistory();
}

// Create late employee section in dashboard
function createLateEmployeeSection() {
    // Check if late employee section already exists
    if (document.getElementById('late-employees-section')) return;
    
    // Find dashboard tab content
    const dashboardTab = document.getElementById('dashboard-tab');
    if (!dashboardTab) return;
    
    // Create late employees section
    const lateEmployeesSection = document.createElement('div');
    lateEmployeesSection.id = 'late-employees-section';
    lateEmployeesSection.className = 'dashboard-section';
    lateEmployeesSection.innerHTML = `
        <div class="section-header">
            <h3>Late Employees</h3>
            <div class="section-actions">
                <button id="refresh-late-btn" class="btn-action">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
        </div>
        <div class="section-body">
            <table id="late-employees-table" class="data-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Branch</th>
                        <th>Scheduled Time</th>
                        <th>Late By</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="6" class="loading-cell">Monitoring for late employees...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Add late employees section to dashboard
    dashboardTab.appendChild(lateEmployeesSection);
    
    // Add warning history section
    const warningHistorySection = document.createElement('div');
    warningHistorySection.id = 'warning-history-section';
    warningHistorySection.className = 'dashboard-section';
    warningHistorySection.innerHTML = `
        <div class="section-header">
            <h3>Warning Letter History</h3>
        </div>
        <div class="section-body">
            <table id="warning-history-table" class="data-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Reason</th>
                        <th>Warning Level</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="5" class="loading-cell">Loading warning history...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Add warning history section to dashboard
    dashboardTab.appendChild(warningHistorySection);
    
    // Add event listener to refresh button
    document.getElementById('refresh-late-btn').addEventListener('click', checkForLateEmployees);
}

// Start monitoring for late employees
function startLateEmployeeMonitoring() {
    // Clear any existing monitoring interval
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }
    
    // Check for late employees immediately
    checkForLateEmployees();
    
    // Set up regular monitoring (check every minute)
    monitoringInterval = setInterval(checkForLateEmployees, 60000);
}

// Check for late employees
function checkForLateEmployees() {
    // In a real application, this would query the server for employees who are late
    // For this example, we'll use simulated data
    
    const lateEmployeesTable = document.getElementById('late-employees-table');
    if (!lateEmployeesTable) return;
    
    // For demo, simulate API fetch
    lateEmployeesTable.querySelector('tbody').innerHTML = 
        '<tr><td colspan="6" class="loading-cell">Checking for late employees...</td></tr>';
    
    setTimeout(() => {
        // Get current date and time
        const now = new Date();
        
        // Simulated scheduled shifts for today - in a real app, fetch from server
        const todaySchedule = [
            {
                id: '1001',
                name: 'John Doe',
                branch: 'Headquarters',
                role: 'Associate',
                scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0),
                clockInTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 17)
            },
            {
                id: '1002',
                name: 'Jane Smith',
                branch: 'Downtown Office',
                role: 'Supervisor',
                scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
                clockInTime: null // Not clocked in yet
            },
            {
                id: '1003',
                name: 'Michael Brown',
                branch: 'West Coast',
                role: 'Manager',
                scheduledTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
                clockInTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 2) // Only 2 minutes late
            }
        ];
        
        // Filter for late employees
        const lateStaff = todaySchedule.filter(employee => {
            // Not clocked in yet
            if (!employee.clockInTime) {
                // Check if scheduled time is in the past
                return new Date() > employee.scheduledTime;
            } 
            // Clocked in late
            else {
                // Calculate minutes late
                const minutesLate = Math.floor((employee.clockInTime - employee.scheduledTime) / (1000 * 60));
                return minutesLate > lateThresholdMinutes;
            }
        });
        
        // Store late employees globally
        lateEmployees = lateStaff;
        
        // Display late employees
        displayLateEmployees(lateStaff);
        
        // Generate notifications for new late employees
        generateLateEmployeeNotifications(lateStaff);
    }, 1000);
}

// Display late employees in table
function displayLateEmployees(lateStaff) {
    const lateEmployeesTable = document.getElementById('late-employees-table');
    if (!lateEmployeesTable) return;
    
    const tbody = lateEmployeesTable.querySelector('tbody');
    
    if (lateStaff.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No late employees found.</td></tr>';
        return;
    }
    
    let html = '';
    lateStaff.forEach(employee => {
        const scheduledTime = formatTime(employee.scheduledTime);
        
        // Calculate how late
        let lateBy = '';
        let statusClass = '';
        let statusText = '';
        
        if (!employee.clockInTime) {
            const minutesLate = Math.floor((new Date() - employee.scheduledTime) / (1000 * 60));
            lateBy = `${minutesLate} minutes and counting`;
            statusClass = minutesLate > 30 ? 'danger' : 'warning';
            statusText = 'Not clocked in';
        } else {
            const minutesLate = Math.floor((employee.clockInTime - employee.scheduledTime) / (1000 * 60));
            lateBy = `${minutesLate} minutes`;
            statusClass = minutesLate > 30 ? 'danger' : 'warning';
            statusText = 'Clocked in late';
        }
        
        html += `
            <tr>
                <td>${employee.name}</td>
                <td>${employee.branch}</td>
                <td>${scheduledTime}</td>
                <td><span class="status-badge ${statusClass}">${lateBy}</span></td>
                <td>${statusText}</td>
                <td>
                    <button class="btn-action send-warning" data-id="${employee.id}" data-name="${employee.name}">Send Warning</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Add event listeners to warning buttons
    document.querySelectorAll('#late-employees-table .btn-action.send-warning').forEach(btn => {
        btn.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            const employeeName = this.getAttribute('data-name');
            openWarningLetterModal(employeeId, employeeName);
        });
    });
}

// Generate notifications for new late employees
function generateLateEmployeeNotifications(lateStaff) {
    // Only create notifications for employees who are not already in notifications
    lateStaff.forEach(employee => {
        // Check if notification already exists for this late instance
        const existingNotification = notifications.find(n => 
            n.type === 'late-check-in' && 
            n.employeeId === employee.id &&
            isSameDay(new Date(n.date), new Date())
        );
        
        if (!existingNotification) {
            const minutesLate = employee.clockInTime 
                ? Math.floor((employee.clockInTime - employee.scheduledTime) / (1000 * 60))
                : Math.floor((new Date() - employee.scheduledTime) / (1000 * 60));
            
            const notificationObj = {
                id: 'late-' + Date.now() + '-' + employee.id,
                title: 'Late Check-in Alert',
                message: `${employee.name} is ${minutesLate} minutes late for their shift at ${employee.branch}.`,
                time: 'Just now',
                type: 'late-check-in',
                status: 'unread',
                actions: ['send-warning', 'read'],
                employeeId: employee.id,
                employeeName: employee.name,
                date: new Date().toISOString(),
                minutesLate: minutesLate,
                branch: employee.branch
            };
            
            // Add to notifications
            notifications.unshift(notificationObj);
            
            // Update UI
            updateUnreadCount();
            
            // Update notifications display if it's currently showing
            if (document.getElementById('notifications-tab').classList.contains('active')) {
                displayNotifications(filterNotificationsByStatus(notificationFilter.value));
            }
        }
    });
}

// Load late employees
function loadLateEmployees() {
    // In a real app, fetch this data from server
    // For now, just execute the check function
    checkForLateEmployees();
}

// Load warning history
function loadWarningHistory() {
    const warningHistoryTable = document.getElementById('warning-history-table');
    if (!warningHistoryTable) return;
    
    // In a real app, fetch from server
    // For demo, use sample data
    setTimeout(() => {
        // Sample warning history data
        warningHistory = [
            {
                id: 'warn-001',
                employeeId: '1001',
                employeeName: 'John Doe',
                date: '2025-04-10T08:17:00',
                reason: 'Late arrival (17 minutes)',
                level: 'First Warning',
                status: 'Sent'
            },
            {
                id: 'warn-002',
                employeeId: '1002',
                employeeName: 'Jane Smith',
                date: '2025-04-05T09:45:00',
                reason: 'Late arrival (45 minutes)',
                level: 'Second Warning',
                status: 'Sent'
            }
        ];
        
        displayWarningHistory(warningHistory);
    }, 1000);
}

// Display warning history
function displayWarningHistory(warnings) {
    const warningHistoryTable = document.getElementById('warning-history-table');
    if (!warningHistoryTable) return;
    
    const tbody = warningHistoryTable.querySelector('tbody');
    
    if (warnings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No warning letters have been sent.</td></tr>';
        return;
    }
    
    let html = '';
    warnings.forEach(warning => {
        const date = formatDateTime(warning.date);
        let levelClass = '';
        
        switch (warning.level) {
            case 'First Warning':
                levelClass = 'warning';
                break;
            case 'Second Warning':
                levelClass = 'danger';
                break;
            case 'Final Warning':
                levelClass = 'danger';
                break;
            default:
                levelClass = 'warning';
        }
        
        html += `
            <tr>
                <td>${warning.employeeName}</td>
                <td>${date}</td>
                <td>${warning.reason}</td>
                <td><span class="status-badge ${levelClass}">${warning.level}</span></td>
                <td>${warning.status}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Open warning letter modal
function openWarningLetterModal(employeeId, employeeName) {
    // Create modal if it doesn't exist
    if (!document.getElementById('warning-letter-modal')) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'warning-letter-modal';
        modalDiv.className = 'modal';
        modalDiv.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="warning-modal-title">Send Warning Letter</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="warning-letter-form">
                        <div class="form-group">
                            <label for="warning-employee">Employee:</label>
                            <input type="text" id="warning-employee" disabled>
                            <input type="hidden" id="warning-employee-id">
                        </div>
                        <div class="form-group">
                            <label for="warning-reason">Reason:</label>
                            <input type="text" id="warning-reason" placeholder="Reason for warning">
                        </div>
                        <div class="form-group">
                            <label for="warning-level">Warning Level:</label>
                            <select id="warning-level">
                                <option value="First Warning">First Warning</option>
                                <option value="Second Warning">Second Warning</option>
                                <option value="Final Warning">Final Warning</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="warning-message">Message:</label>
                            <textarea id="warning-message" rows="8"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button id="send-warning-btn" class="btn-primary">Send Warning</button>
                    <button id="cancel-warning-btn" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalDiv);
        
        // Add event listeners
        document.querySelector('#warning-letter-modal .close-modal').addEventListener('click', closeWarningModal);
        document.getElementById('cancel-warning-btn').addEventListener('click', closeWarningModal);
        document.getElementById('send-warning-btn').addEventListener('click', sendWarningLetter);
        
        // Pre-populate warning message template when reason or level changes
        document.getElementById('warning-reason').addEventListener('input', populateWarningTemplate);
        document.getElementById('warning-level').addEventListener('change', populateWarningTemplate);
    }
    
    // Get employee name if not provided
    if (!employeeName && employeeId) {
        const employee = lateEmployees.find(e => e.id === employeeId);
        if (employee) {
            employeeName = employee.name;
        } else {
            // Try to find in notifications
            const notification = notifications.find(n => n.employeeId === employeeId);
            if (notification) {
                employeeName = notification.employeeName;
            }
        }
    }
    
    // Get lateness details
    let latenessDetails = '';
    const employee = lateEmployees.find(e => e.id === employeeId);
    if (employee) {
        const minutesLate = employee.clockInTime 
            ? Math.floor((employee.clockInTime - employee.scheduledTime) / (1000 * 60))
            : Math.floor((new Date() - employee.scheduledTime) / (1000 * 60));
        latenessDetails = `Late arrival (${minutesLate} minutes)`;
    }
    
    // Show modal and populate fields
    const warningModal = document.getElementById('warning-letter-modal');
    document.getElementById('warning-employee').value = employeeName || 'Unknown Employee';
    document.getElementById('warning-employee-id').value = employeeId || '';
    document.getElementById('warning-reason').value = latenessDetails;
    
    // Set appropriate warning level based on history
    const existingWarnings = warningHistory.filter(w => w.employeeId === employeeId);
    let warningLevel = 'First Warning';
    
    if (existingWarnings.length === 1) {
        warningLevel = 'Second Warning';
    } else if (existingWarnings.length >= 2) {
        warningLevel = 'Final Warning';
    }
    
    document.getElementById('warning-level').value = warningLevel;
    
    // Populate initial template
    populateWarningTemplate();
    
    // Show modal
    warningModal.style.display = 'block';
}

// Populate warning letter template
function populateWarningTemplate() {
    const employeeName = document.getElementById('warning-employee').value;
    const reason = document.getElementById('warning-reason').value;
    const level = document.getElementById('warning-level').value;
    const messageArea = document.getElementById('warning-message');
    
    // Warning letter template based on level
    let template = '';
    
    // Get current date formatted
    const currentDate = formatDate(new Date());
    
    if (level === 'Final Warning') {
        template = `Dear ${employeeName},

This letter serves as a FINAL WARNING regarding your recent violation of company attendance policy: ${reason}.

This is now the third documented occurrence of this violation. Any further incidents may result in immediate termination of employment.

You are required to acknowledge receipt of this warning and commit to immediate and sustained improvement.

Date: ${currentDate}

Please contact HR if you have any questions or concerns.`;
    } else if (level === 'Second Warning') {
        template = `Dear ${employeeName},

This letter serves as a SECOND WARNING regarding your recent violation of company attendance policy: ${reason}.

Please be aware that this is the second documented occurrence of this violation. Any further incidents will result in a final warning before possible termination.

You are required to acknowledge receipt of this warning and commit to immediate improvement.

Date: ${currentDate}

Please contact HR if you have any questions or concerns.`;
    } else {
        template = `Dear ${employeeName},

This letter serves as a formal warning regarding your recent violation of company attendance policy: ${reason}.

Please be aware that this behavior does not meet our company's expectations and standards. We expect all employees to arrive on time for their scheduled shifts.

You are required to acknowledge receipt of this warning and commit to improvement going forward.

Date: ${currentDate}

Please contact HR if you have any questions or concerns.`;
    }
    
    messageArea.value = template;
}

// Close warning letter modal
function closeWarningModal() {
    const warningModal = document.getElementById('warning-letter-modal');
    if (warningModal) {
        warningModal.style.display = 'none';
    }
}

// Send warning letter
function sendWarningLetter() {
    const employeeId = document.getElementById('warning-employee-id').value;
    const employeeName = document.getElementById('warning-employee').value;
    const reason = document.getElementById('warning-reason').value;
    const level = document.getElementById('warning-level').value;
    const message = document.getElementById('warning-message').value;
    
    if (!reason || !message) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // In a real app, send to server
    // For demo, just add to warning history
    const warningObj = {
        id: 'warn-' + Date.now().toString(36),
        employeeId: employeeId,
        employeeName: employeeName,
        date: new Date().toISOString(),
        reason: reason,
        level: level,
        status: 'Sent',
        message: message
    };
    
    // Add to warning history
    warningHistory.unshift(warningObj);
    
    // Update UI
    displayWarningHistory(warningHistory);
    
    // Close modal
    closeWarningModal();
    
    // Show success message
    alert(`Warning letter sent to ${employeeName}.`);
    
    // Send email notification (in a real app)
    console.log(`Sending email to ${employeeName} with warning letter:`, warningObj);
}

// Setup lateness settings
function setupLatenessSettings() {
    const settingsTab = document.getElementById('settings-tab');
    if (!settingsTab) return;
    
    // Check if lateSettings section already exists
    if (document.getElementById('lateness-settings')) return;
    
    // Create lateness settings section
    const lateSettings = document.createElement('div');
    lateSettings.id = 'lateness-settings';
    lateSettings.className = 'settings-category';
    lateSettings.innerHTML = `
        <h2>Lateness Settings</h2>
        <div class="settings-item">
            <div class="settings-item-main">
                <div class="settings-item-name">Lateness Threshold (minutes)</div>
                <div class="settings-item-detail">
                    <input type="number" id="lateness-threshold" min="1" max="60" value="${lateThresholdMinutes}">
                </div>
            </div>
            <div class="settings-item-actions">
                <button id="save-lateness-threshold" class="btn-action">Save</button>
            </div>
        </div>
        <div class="settings-item">
            <div class="settings-item-main">
                <div class="settings-item-name">Late Employee Monitoring</div>
                <div class="settings-item-detail">
                    <select id="monitoring-frequency">
                        <option value="30000">Every 30 seconds</option>
                        <option value="60000" selected>Every minute</option>
                        <option value="120000">Every 2 minutes</option>
                        <option value="300000">Every 5 minutes</option>
                    </select>
                </div>
            </div>
            <div class="settings-item-actions">
                <button id="save-monitoring-frequency" class="btn-action">Save</button>
            </div>
        </div>
    `;
    
    // Add to settings tab
    settingsTab.appendChild(lateSettings);
    
    // Add event listeners
    document.getElementById('save-lateness-threshold').addEventListener('click', function() {
        const threshold = parseInt(document.getElementById('lateness-threshold').value);
        if (threshold >= 1 && threshold <= 60) {
            lateThresholdMinutes = threshold;
            alert(`Lateness threshold updated to ${threshold} minutes.`);
            
            // Refresh late employee checks with new threshold
            checkForLateEmployees();
        } else {
            alert('Please enter a valid threshold between 1 and 60 minutes.');
        }
    });
    
    document.getElementById('save-monitoring-frequency').addEventListener('click', function() {
        const frequency = parseInt(document.getElementById('monitoring-frequency').value);
        
        // Clear existing interval
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
        }
        
        // Set new interval
        monitoringInterval = setInterval(checkForLateEmployees, frequency);
        
        alert(`Monitoring frequency updated successfully.`);
    });
}

// Helper function to format time (HH:MM AM/PM)
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// Create emoji picker if it doesn't exist
function createEmojiPicker() {
    if (document.getElementById('emoji-picker')) {
        return; // Emoji picker already exists
    }
    
    // Create the emoji picker container
    const emojiPicker = document.createElement('div');
    emojiPicker.id = 'emoji-picker';
    emojiPicker.className = 'emoji-picker';
    emojiPicker.style.display = 'none';
    
    // Add common emojis
    const commonEmojis = ['😊', '😂', '👍', '❤️', '🎉', '👋', '🙏', '👀', '✅', '⏰', '☕', '🤔', 
                          '👏', '🔥', '💡', '💯', '🏆', '🎯', '🚀', '⚠️', '📝', '📞', '💬'];
    
    commonEmojis.forEach(emoji => {
        const emojiBtn = document.createElement('span');
        emojiBtn.className = 'emoji';
        emojiBtn.textContent = emoji;
        emojiBtn.addEventListener('click', () => {
            insertEmoji(emoji);
            toggleEmojiPicker(false);
        });
        emojiPicker.appendChild(emojiBtn);
    });
    
    // Add the emoji picker to the chat input container
    const chatInputContainer = document.querySelector('.chat-input-container');
    if (chatInputContainer) {
        chatInputContainer.appendChild(emojiPicker);
        
        // Add CSS for the emoji picker if not already present
        if (!document.getElementById('emoji-picker-styles')) {
            const style = document.createElement('style');
            style.id = 'emoji-picker-styles';
            style.textContent = `
                .emoji-picker {
                    position: absolute;
                    bottom: 60px;
                    left: 10px;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.2);
                    padding: 10px;
                    z-index: 100;
                    display: flex;
                    flex-wrap: wrap;
                    width: 280px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .emoji {
                    font-size: 22px;
                    padding: 5px;
                    cursor: pointer;
                    transition: transform 0.1s, background-color 0.2s;
                    border-radius: 5px;
                }
                .emoji:hover {
                    transform: scale(1.2);
                    background-color: #f0f0f0;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.closest('#emoji-btn') || e.target.closest('#emoji-picker')) {
            return; // Clicked on emoji button or picker itself
        }
        
        // Close the emoji picker
        toggleEmojiPicker(false);
    });
}

// Initialize meetings functionality
function initializeMeetings() {
    // Check if meeting elements exist
    if (!meetingBtn || !meetingModal) return;
    
    // Set default date and time for meeting scheduler
    const today = new Date();
    const dateInput = document.getElementById('meeting-date');
    const timeInput = document.getElementById('meeting-time');
    
    if (dateInput) {
        dateInput.valueAsDate = today;
    }
    
    if (timeInput) {
        timeInput.value = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Populate participants dropdown with staff members
    populateMeetingParticipants();
    
    // Add event listeners
    if (meetingBtn) {
        meetingBtn.addEventListener('click', function() {
            openMeetingModal();
        });
    }
    
    // The start meeting card in the dashboard should also open the meeting modal
    if (startMeetingCard) {
        startMeetingCard.addEventListener('click', function() {
            openMeetingModal();
        });
    }
    
    if (closeMeetingBtn) {
        closeMeetingBtn.addEventListener('click', closeMeetingModal);
    }
    
    if (instantMeetingBtn) {
        instantMeetingBtn.addEventListener('click', startInstantMeeting);
    }
    
    if (scheduleMeetingBtn) {
        scheduleMeetingBtn.addEventListener('click', function() {
            meetingForm.style.display = 'block';
            meetingSuccess.style.display = 'none';
        });
    }
    
    if (createMeetingBtn) {
        createMeetingBtn.addEventListener('click', scheduleMeeting);
    }
    
    if (copyMeetingLinkBtn) {
        copyMeetingLinkBtn.addEventListener('click', copyMeetingLink);
    }
    
    if (sendMeetingInvitesBtn) {
        sendMeetingInvitesBtn.addEventListener('click', sendMeetingInvites);
    }
    
    // Check for scheduled meetings and show notifications
    checkScheduledMeetings();
    
    // Set interval to check for meetings every 5 minutes
    setInterval(checkScheduledMeetings, 5 * 60 * 1000);
}

// Open meeting modal
function openMeetingModal() {
    meetingModal.style.display = 'block';
    meetingForm.style.display = 'none';
    meetingSuccess.style.display = 'none';
    
    // Hide meeting notification if shown
    if (meetingNotification) {
        meetingNotification.style.display = 'none';
    }
}

// Close meeting modal
function closeMeetingModal() {
    meetingModal.style.display = 'none';
}

// Populate meeting participants dropdown with staff
function populateMeetingParticipants() {
    const participantsSelect = document.getElementById('meeting-participants');
    if (!participantsSelect || !allStaff) return;
    
    // Clear existing options
    participantsSelect.innerHTML = '';
    
    // Add all staff members as options
    allStaff.forEach(staff => {
        const option = document.createElement('option');
        option.value = staff.username;
        option.textContent = staff.name;
        // Select all staff by default
        option.selected = true;
        participantsSelect.appendChild(option);
    });
}

// Start instant meeting
function startInstantMeeting() {
    // In a real application, this would make an API call to create a meeting
    // For this simulation, we'll generate a mock meeting ID and URL
    
    const meetingId = generateMeetingId();
    const meetingUrl = `https://meeting.shiftq.com/${meetingId}`;
    
    // Store the meeting in local storage
    const meeting = {
        id: meetingId,
        type: 'instant',
        title: 'Instant Meeting',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        url: meetingUrl,
        status: 'active'
    };
    
    // Add to stored meetings
    saveMeeting(meeting);
    
    // Notify staff of the meeting
    notifyStaffOfMeeting(meeting);
    
    // Display success message
    meetingDetails.innerHTML = `
        <p><strong>Meeting ID:</strong> ${meeting.id}</p>
        <p><strong>Meeting URL:</strong> <a href="${meeting.url}" target="_blank">${meeting.url}</a></p>
        <p><strong>Type:</strong> Instant Meeting</p>
        <p><strong>Created by:</strong> You</p>
        <p><strong>Created on:</strong> ${new Date().toLocaleString()}</p>
    `;
    
    meetingDetails.dataset.meetingUrl = meeting.url;
    meetingForm.style.display = 'none';
    meetingSuccess.style.display = 'block';
    
    // In a real application, you might open the meeting in a new tab
    // window.open(meetingUrl, '_blank');
}

// Schedule a meeting
function scheduleMeeting() {
    const titleInput = document.getElementById('meeting-title');
    const dateInput = document.getElementById('meeting-date');
    const timeInput = document.getElementById('meeting-time');
    const durationInput = document.getElementById('meeting-duration');
    const participantsSelect = document.getElementById('meeting-participants');
    const descriptionInput = document.getElementById('meeting-description');
    
    // Validate required fields
    if (!titleInput.value || !dateInput.value || !timeInput.value) {
        showToast('Please fill in all required fields');
        return;
    }
    
    // Get selected participants
    const selectedParticipants = Array.from(participantsSelect.selectedOptions).map(option => {
        return {
            username: option.value,
            name: option.textContent
        };
    });
    
    // Generate meeting details
    const meetingId = generateMeetingId();
    const meetingUrl = `https://meeting.shiftq.com/${meetingId}`;
    const meetingDate = new Date(`${dateInput.value}T${timeInput.value}`);
    
    // Create meeting object
    const meeting = {
        id: meetingId,
        type: 'scheduled',
        title: titleInput.value,
        description: descriptionInput.value,
        date: dateInput.value,
        time: timeInput.value,
        duration: durationInput.value,
        url: meetingUrl,
        participants: selectedParticipants,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        status: 'scheduled'
    };
    
    // Save meeting
    saveMeeting(meeting);
    
    // Notify staff of scheduled meeting
    notifyStaffOfMeeting(meeting);
    
    // Format date and time for display
    const formattedDate = meetingDate.toLocaleDateString();
    const formattedTime = meetingDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Show success message
    meetingDetails.innerHTML = `
        <p><strong>Title:</strong> ${meeting.title}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
        <p><strong>Meeting URL:</strong> <a href="${meeting.url}" target="_blank">${meeting.url}</a></p>
        ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
        <p><strong>Participants:</strong> ${selectedParticipants.length > 0 ? 
            selectedParticipants.map(p => p.name).join(', ') : 
            'None selected'}</p>
    `;
    
    meetingDetails.dataset.meetingUrl = meeting.url;
    meetingForm.style.display = 'none';
    meetingSuccess.style.display = 'block';
    
    // Reset form
    titleInput.value = '';
    descriptionInput.value = '';
}

// Copy meeting link to clipboard
function copyMeetingLink() {
    const meetingUrl = meetingDetails.dataset.meetingUrl;
    if (meetingUrl) {
        navigator.clipboard.writeText(meetingUrl).then(
            () => showToast('Meeting link copied to clipboard!'),
            () => showToast('Failed to copy meeting link')
        );
    }
}

// Send meeting invites to participants
function sendMeetingInvites() {
    // In a real application, this would send emails or notifications to participants
    // For this simulation, we'll just add a notification to localStorage
    
    showToast('Meeting invites sent to participants!');
    
    // Here we would also update the meeting status to 'invites_sent'
    // and refresh the meetings list
}

// Generate a unique meeting ID
function generateMeetingId() {
    return 'meet_' + Math.random().toString(36).substring(2, 10);
}

// Save meeting to localStorage
function saveMeeting(meeting) {
    const meetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
    meetings.push(meeting);
    localStorage.setItem('scheduledMeetings', JSON.stringify(meetings));
    localStorage.setItem('meetingsLastUpdated', new Date().toISOString());
}

// Notify staff of meeting
function notifyStaffOfMeeting(meeting) {
    // In a real application, this would send notifications to staff
    // For this simulation, we'll create a notification in localStorage
    
    const notifications = JSON.parse(localStorage.getItem('meetingNotifications') || '[]');
    const notification = {
        id: 'notification_' + Date.now(),
        type: meeting.type === 'instant' ? 'instant_meeting' : 'scheduled_meeting',
        title: meeting.title || 'New Meeting',
        meeting_id: meeting.id,
        created_at: new Date().toISOString(),
        read: false
    };
    
    notifications.push(notification);
    localStorage.setItem('meetingNotifications', JSON.stringify(notifications));
}

// Check for scheduled meetings and show notification
function checkScheduledMeetings() {
    const meetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
    
    // Filter for upcoming meetings (within the next 30 minutes)
    const now = new Date();
    const upcomingMeetings = meetings.filter(meeting => {
        // Skip if it's not a scheduled meeting
        if (meeting.type !== 'scheduled') return false;
        
        // Parse meeting date and time
        const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
        
        // Check if meeting is within the next 30 minutes
        const timeDiff = meetingDateTime - now;
        return timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // 30 minutes in milliseconds
    });
    
    // If there are upcoming meetings, show notification
    if (upcomingMeetings.length > 0) {
        // Update meeting notification badge
        if (meetingNotification) {
            meetingNotification.textContent = upcomingMeetings.length;
            meetingNotification.style.display = 'flex';
        }
        
        // Add a notification to the notifications list
        for (const meeting of upcomingMeetings) {
            // Check if we've already notified for this meeting
            const notifiedMeetings = JSON.parse(localStorage.getItem('notifiedMeetings') || '[]');
            if (notifiedMeetings.includes(meeting.id)) continue;
            
            // Add notification
            addMeetingNotification(meeting);
            
            // Mark as notified
            notifiedMeetings.push(meeting.id);
            localStorage.setItem('notifiedMeetings', JSON.stringify(notifiedMeetings));
        }
    }
}

// Add a meeting notification to the notifications list
function addMeetingNotification(meeting) {
    const notificationList = document.getElementById('notification-list');
    if (!notificationList) return;
    
    // Create notification element
    const notificationItem = document.createElement('div');
    notificationItem.className = 'notification-item unread';
    notificationItem.dataset.id = 'meeting_' + meeting.id;
    
    // Format meeting time
    const meetingTime = new Date(`${meeting.date}T${meeting.time}`);
    const formattedTime = meetingTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    notificationItem.innerHTML = `
        <div class="notification-icon meeting-notification">
            <i class="fas fa-video"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">Upcoming Meeting: ${meeting.title}</div>
            <div class="notification-message">
                A meeting is scheduled for today at ${formattedTime}. 
                ${meeting.participants?.length ? 
                    `Participants: ${meeting.participants.map(p => p.name).join(', ')}` : ''}
            </div>
            <div class="notification-time">Starting soon</div>
        </div>
        <div class="notification-actions">
            <button class="btn-action read-notification" data-id="meeting_${meeting.id}" title="Mark as read">
                <i class="fas fa-check"></i>
            </button>
        </div>
    `;
    
    // Insert at the top of the notifications list
    notificationList.insertBefore(notificationItem, notificationList.firstChild);
    
    // Update unread count
    updateNotificationCount();
}

// Update notification count badge
function updateNotificationCount() {
    // Count unread notifications
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    const notificationCountBadge = document.querySelector('.notification-count');
    const notificationBadge = document.querySelector('.notification-badge');
    
    if (notificationCountBadge) {
        notificationCountBadge.textContent = unreadNotifications.length;
    }
    
    if (notificationBadge) {
        notificationBadge.textContent = unreadNotifications.length;
    }
}

// Show toast notification
function showToast(message, duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translateX(-50%)';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.style.backgroundColor = '#323232';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    toast.textContent = message;
    
    // Append to container and animate
    toastContainer.appendChild(toast);
    
    // Trigger animation (wait a bit for the DOM to update)
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Hide after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300); // Wait for fade out animation
    }, duration);
}

// Admin portal real-time communication
let staffEventListener = null;
let lastEventCheckTime = null;

// Setup real-time event handling from staff portal
function setupStaffEventListener() {
    // Initialize empty array if it doesn't exist
    if (!localStorage.getItem('adminPortalEvents')) {
        localStorage.setItem('adminPortalEvents', '[]');
    }
    
    // Store current time as last check time
    lastEventCheckTime = new Date().toISOString();
    
    // Set up event listener for same-tab events
    window.addEventListener('admin-portal-event', handleStaffEvent);
    
    // Start polling for events from localStorage (cross-tab communication)
    staffEventListener = setInterval(checkForStaffEvents, 2000); // Check every 2 seconds
    
    console.log('Admin portal real-time event listener started');
}

// Check for new staff events in localStorage
function checkForStaffEvents() {
    const eventsUpdated = localStorage.getItem('adminPortalEventsUpdated');
    
    // If last updated timestamp exists and is newer than our last check
    if (eventsUpdated && new Date(eventsUpdated) > new Date(lastEventCheckTime)) {
        const events = JSON.parse(localStorage.getItem('adminPortalEvents') || '[]');
        
        // Filter only new events
        const newEvents = events.filter(event => 
            new Date(event.timestamp) > new Date(lastEventCheckTime)
        );
        
        // Process each new event
        newEvents.forEach(event => {
            handleStaffEvent({ detail: event });
        });
        
        // Update last check time
        lastEventCheckTime = new Date().toISOString();
    }
}

// Handle staff events
function handleStaffEvent(e) {
    const event = e.detail;
    
    console.log('Received staff event:', event.type, event);
    
    switch(event.type) {
        case 'clock-in':
            handleClockInEvent(event);
            break;
            
        case 'clock-out':
            handleClockOutEvent(event);
            break;
            
        case 'leave-request':
            handleLeaveRequestEvent(event);
            break;
            
        case 'shift-swap':
            handleShiftSwapEvent(event);
            break;
    }
}

// Real-time processing functions - consolidated
function handleClockInEvent(event) {
    // Show notification
    showAdminNotification(
        'New Clock In',
        `${event.staffName} clocked in at ${formatDisplayTime(event.data.timestamp)}`,
        'clock'
    );
    
    // Add to activity feed
    addToActivityFeed({
        type: 'clock-in',
        icon: 'fas fa-clock',
        color: 'var(--highlight-green)',
        title: 'Clock In',
        message: `${event.staffName} clocked in at ${formatDisplayTime(event.data.timestamp)}`,
        details: `Branch: ${event.data.branch}, Role: ${event.data.role}`,
        timestamp: event.data.timestamp
    });
    
    // Create a new active staff entry
    const newActiveStaff = {
        name: event.staffName,
        branch: event.data.branch,
        role: event.data.role,
        clock_in_time: event.data.timestamp,
        clock_out_time: null,
        clock_in_location: { address: 'Current location' },
        id: `shift-${Date.now()}`
    };
    
    // Add to allShifts array to ensure it persists on page reload
    if (Array.isArray(allShifts)) {
        allShifts.push(newActiveStaff);
    }
    
    // Force update the active staff display immediately
    const activeShifts = Array.isArray(allShifts) ? 
        allShifts.filter(shift => shift.clock_out_time === null) : [newActiveStaff];
    
    // Direct DOM update for active staff table
    updateActiveStaffTable(activeShifts);
    
    // Update dashboard counts and stats
    updateDashboardStats(allShifts);
    
    // Show real-time indicator
    addRealTimeIndicator(activeStaffTable);
}

// Function to immediately update the active staff table with provided data
function updateActiveStaffTable(activeShifts) {
    if (!activeStaffTable) return;
    
    if (activeShifts.length === 0) {
        activeStaffTable.innerHTML = `
            <tr>
                <td colspan="5" class="loading-cell">No active staff members at the moment.</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    activeShifts.forEach(shift => {
        const isNew = shift.isNew ? ' class="new-active-staff"' : '';
        const clockInTime = formatDateTime(shift.clock_in_time);
        
        html += `
            <tr${isNew} data-staff-id="${shift.id || ''}" data-staff-name="${shift.name || ''}">
                <td>${shift.name}</td>
                <td>${shift.branch}</td>
                <td>${shift.role}</td>
                <td>${clockInTime}</td>
                <td>${shift.clock_in_location ? shift.clock_in_location.address : 'Location data unavailable'}</td>
            </tr>
        `;
    });
    
    activeStaffTable.innerHTML = html;
    
    // Add highlight animation to new entries
    document.querySelectorAll('.new-active-staff').forEach(row => {
        row.classList.add('highlight-animation');
        
        // Remove highlighting classes after animation completes
        setTimeout(() => {
            row.classList.remove('highlight-animation');
            row.classList.remove('new-active-staff');
        }, 3000);
    });
}

// Single consolidated function for handling leave request events
function handleLeaveRequestEvent(event) {
    // Show notification
    showAdminNotification(
        'New Leave Request',
        `${event.staffName} requested leave from ${event.data.formattedStart} to ${event.data.formattedEnd}`,
        'calendar'
    );
    
    // Add to activity feed
    addToActivityFeed({
        type: 'leave-request',
        icon: 'fas fa-calendar-alt',
        color: 'var(--highlight-blue)',
        title: 'Leave Request',
        message: `${event.staffName} requested leave from ${event.data.formattedStart} to ${event.data.formattedEnd}`,
        details: `Reason: ${event.data.reason}`,
        timestamp: event.timestamp,
        actions: [
            { label: 'Approve', action: 'approveLeave', data: { requestId: event.data.requestId } },
            { label: 'Deny', action: 'denyLeave', data: { requestId: event.data.requestId } }
        ]
    });
    
    // Update pending approvals section
    updatePendingApprovals();
    
    // Add directly to pending leave requests table for real-time display
    addPendingLeaveRequestToTable({
        id: event.data.requestId || `leave-${new Date().getTime()}`,
        name: event.staffName,
        start_date: event.data.startDate,
        end_date: event.data.endDate, 
        reason: event.data.reason,
        status: 'pending'
    });
}

// Single consolidated function for adding leave requests to table
function addPendingLeaveRequestToTable(leaveRequest) {
    if (!leaveRequestsTable) return;
    
    // Check if there's a placeholder "no pending requests" row
    const noRequestsRow = leaveRequestsTable.querySelector('tr td.loading-cell');
    if (noRequestsRow) {
        leaveRequestsTable.innerHTML = ''; // Clear the placeholder
    }
    
    // Format dates
    const startDate = formatDate(new Date(leaveRequest.start_date));
    const endDate = formatDate(new Date(leaveRequest.end_date));
    
    // Create a new row
    const newRow = document.createElement('tr');
    newRow.className = 'new-request highlight-animation';
    newRow.dataset.id = leaveRequest.id;
    newRow.innerHTML = `
        <td>${leaveRequest.name}</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td>${leaveRequest.reason}</td>
        <td>
            <button class="btn-action approve" data-id="${leaveRequest.id}">Approve</button>
            <button class="btn-action reject" data-id="${leaveRequest.id}">Reject</button>
        </td>
    `;
    
    // Add the row to the table (at the top)
    leaveRequestsTable.insertBefore(newRow, leaveRequestsTable.firstChild);
    
    // Add event listeners to buttons
    newRow.querySelectorAll('.btn-action').forEach(btn => {
        btn.addEventListener('click', handleLeaveAction);
    });
    
    // Add highlight animation
    setTimeout(() => {
        newRow.classList.add('highlight-animation');
        
        // Remove highlight after animation completes
        setTimeout(() => {
            newRow.classList.remove('highlight-animation');
            newRow.classList.remove('new-request');
        }, 5000);
    }, 100);
    
    // Add CSS for highlight if not already present
    if (!document.getElementById('leave-request-highlight-style')) {
        const style = document.createElement('style');
        style.id = 'leave-request-highlight-style';
        style.innerHTML = `
            .new-request {
                background-color: rgba(52, 152, 219, 0.2);
            }
            
            .highlight-animation {
                animation: fadeHighlight 5s ease-out;
            }
            
            @keyframes fadeHighlight {
                from { background-color: rgba(52, 152, 219, 0.2); }
                to { background-color: transparent; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add real-time indicator
    addRealTimeIndicator(leaveRequestsTable);
    
    // Update leave count in dashboard
    const currentCount = parseInt(leaveCountElem.textContent || '0');
    leaveCountElem.textContent = currentCount + 1;
}

// Handle clock-out events
function handleClockOutEvent(event) {
    // Show notification
    showAdminNotification(
        'New Clock Out',
        `${event.staffName} clocked out at ${formatDisplayTime(event.data.timestamp)}`,
        'clock'
    );
    
    // Add to activity feed
    addToActivityFeed({
        type: 'clock-out',
        icon: 'fas fa-stopwatch',
        color: 'var(--highlight-orange)',
        title: 'Clock Out',
        message: `${event.staffName} clocked out at ${formatDisplayTime(event.data.timestamp)}`,
        details: event.data.duration ? `Shift duration: ${formatDuration(event.data.duration)}` : '',
        timestamp: event.data.timestamp
    });
    
    // Update live dashboard counts
    updateDashboardCounts();
}

// Handle shift swap events
function handleShiftSwapEvent(event) {
    // Show notification
    showAdminNotification(
        'New Shift Swap Request',
        `${event.staffName} requested to swap shifts with ${event.data.targetName}`,
        'exchange'
    );
    
    // Add to activity feed
    addToActivityFeed({
        type: 'shift-swap',
        icon: 'fas fa-exchange-alt',
        color: 'var(--highlight-purple)',
        title: 'Shift Swap Request',
        message: `${event.staffName} requested to swap shifts with ${event.data.targetName}`,
        details: `Shift: ${event.data.shiftDetails}<br>Reason: ${event.data.reason}`,
        timestamp: event.timestamp,
        actions: [
            { label: 'Approve', action: 'approveSwap', data: { requestId: event.data.requestId } },
            { label: 'Deny', action: 'denySwap', data: { requestId: event.data.requestId } }
        ]
    });
    
    // Update pending approvals section
    updatePendingApprovals();
}

// Show admin notification
function showAdminNotification(title, message, icon = 'info') {
    // Select icon class
    let iconClass = 'fas fa-info-circle';
    switch(icon) {
        case 'clock': iconClass = 'fas fa-clock'; break;
        case 'calendar': iconClass = 'fas fa-calendar-alt'; break;
        case 'exchange': iconClass = 'fas fa-exchange-alt'; break;
        case 'alert': iconClass = 'fas fa-exclamation-circle'; break;
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'admin-notification';
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            <div class="notification-time">Just now</div>
        </div>
        <div class="notification-close">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.classList.add('notification-closing');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Add notification to container
    const container = document.getElementById('admin-notifications');
    if (!container) {
        // Create container if it doesn't exist
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'admin-notifications';
        document.body.appendChild(notificationContainer);
        notificationContainer.appendChild(notification);
    } else {
        container.appendChild(notification);
    }
    
    // Add notification appearance animation
    notification.style.animation = 'slideInRight 0.3s forwards';
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        notification.classList.add('notification-closing');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 10000);
    
    // Add CSS if not already present
    if (!document.getElementById('admin-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-notification-styles';
        style.innerHTML = `
            #admin-notifications {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 350px;
            }
            
            .admin-notification {
                background-color: white;
                border-left: 4px solid #3498db;
                border-radius: 6px;
                box-shadow: 0 3px 15px rgba(0, 0, 0, 0.2);
                padding: 15px;
                display: flex;
                align-items: flex-start;
                transform: translateX(400px);
            }
            
            @keyframes slideInRight {
                from { transform: translateX(400px); }
                to { transform: translateX(0); }
            }
            
            .notification-closing {
                animation: fadeOut 0.3s forwards;
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(400px); }
            }
            
            .notification-icon {
                margin-right: 12px;
                font-size: 1.5rem;
                color: #3498db;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-title {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .notification-message {
                font-size: 0.9rem;
                color: #555;
            }
            
                font-size: 0.9rem;
            }
            
            .notification-close:hover {
                color: #555;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Play notification sound
    playNotificationSound();
}

// Play notification sound
function playNotificationSound() {
    // Check if notifications are muted
    const notificationsMuted = localStorage.getItem('adminNotificationsMuted') === 'true';
    if (notificationsMuted) return;
    
    // Play sound
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Could not play notification sound:', err));
}

// Format timestamp for display
function formatDisplayTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

// Format duration (seconds) to display format (e.g. "2h 30m")
function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

// Add event to the activity feed
function addToActivityFeed(activity) {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) return;
    
    // Create activity item element
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.dataset.timestamp = activity.timestamp;
    activityItem.dataset.type = activity.type;
    
    // Format the timestamp
    const timestamp = new Date(activity.timestamp);
    const timeString = timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    const dateString = timestamp.toLocaleDateString('en-US', {day: 'numeric', month: 'short'});
    
    // Create action buttons if provided
    let actionsHTML = '';
    if (activity.actions && activity.actions.length > 0) {
        actionsHTML = '<div class="activity-actions">';
        activity.actions.forEach(action => {
            actionsHTML += `<button class="activity-action" data-action="${action.action}" data-json='${JSON.stringify(action.data)}'>${action.label}</button>`;
        });
        actionsHTML += '</div>';
    }
    
    // Construct the activity item
    activityItem.innerHTML = `
        <div class="activity-icon" style="background-color: ${activity.color || 'var(--highlight-gray)'}">
            <i class="${activity.icon || 'fas fa-bell'}"></i>
        </div>
        <div class="activity-content">
            <div class="activity-title">
                <span class="activity-type">${activity.title}</span>
                <span class="activity-time">${timeString} · ${dateString}</span>
            </div>
            <div class="activity-message">${activity.message}</div>
            ${activity.details ? `<div class="activity-details">${activity.details}</div>` : ''}
            ${actionsHTML}
        </div>
    `;
    
    // Add event listeners to action buttons
    if (activity.actions) {
        activityItem.querySelectorAll('.activity-action').forEach(button => {
            button.addEventListener('click', function() {
                const actionType = this.getAttribute('data-action');
                const actionData = JSON.parse(this.getAttribute('data-json'));
                handleActivityAction(actionType, actionData, activityItem);
            });
        });
    }
    
    // Add to the beginning of the feed
    activityFeed.insertBefore(activityItem, activityFeed.firstChild);
    
    // Limit the number of activities shown
    const maxActivities = 50;
    while (activityFeed.children.length > maxActivities) {
        activityFeed.removeChild(activityFeed.lastChild);
    }
    
    // Show "new" indicator
    activityItem.classList.add('new-activity');
    setTimeout(() => {
        activityItem.classList.remove('new-activity');
    }, 5000);
}

// Handle activity actions (approve/deny buttons)
function handleActivityAction(actionType, data, activityItem) {
    console.log('Action triggered:', actionType, data);
    
    switch(actionType) {
        case 'approveLeave':
            approveLeaveRequest(data.requestId, activityItem);
            break;
            
        case 'denyLeave':
            denyLeaveRequest(data.requestId, activityItem);
            break;
            
        case 'approveSwap':
            approveShiftSwap(data.requestId, activityItem);
            break;
            
        case 'denySwap':
            denyShiftSwap(data.requestId, activityItem);
            break;
    }
}

// Update pending approvals section
function updatePendingApprovals() {
    // Refresh leave requests
    fetch('/get_leave_requests')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allLeaveRequests = data.leave_requests;
                displayPendingLeaveRequests(allLeaveRequests);
                updateLeaveStats(allLeaveRequests);
            }
        })
        .catch(error => console.error('Error:', error));
    
    // Refresh shift change requests
    fetch('/get_shift_change_requests')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allShiftChangeRequests = data.requests;
                const shiftSwapRequestsTable = document.getElementById('shift-swap-requests-table');
                if (shiftSwapRequestsTable) {
                    displayShiftChangeRequests(allShiftChangeRequests);
                }
            }
        })
        .catch(error => console.error('Error:', error));
}

// Update dashboard counts
function updateDashboardCounts() {
    // Refresh shifts data
    fetch('/get_shifts')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                allShifts = data.shifts;
                updateDashboardStats(allShifts);
                
                // Immediately update active staff display for real-time updates
                displayActiveStaff(allShifts);
                
                // Update shift table if on shifts tab
                const activeTab = document.querySelector('.admin-sidebar nav ul li.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'shifts') {
                    displayShifts(allShifts);
                }
                
                // Notify admin about staff activity changes
                const activeStaffCount = allShifts.filter(shift => shift.clock_out_time === null).length;
                
                // Add staff activity status update to the activity feed
                addToActivityFeed({
                    type: 'staff-update',
                    icon: 'fas fa-users',
                    color: 'var(--highlight-blue)',
                    title: 'Staff Activity Update',
                    message: `Currently ${activeStaffCount} staff member${activeStaffCount !== 1 ? 's' : ''} active.`,
                    details: 'Real-time staff activity update.',
                    timestamp: new Date().toISOString()
                });
            }
        })
        .catch(error => console.error('Error updating dashboard counts:', error));
}

// Add new active staff member directly to the active staff table
function addActiveStaffMember(staff) {
    const activeStaffTable = document.getElementById('active-staff-table');
    if (!activeStaffTable) return;
    
    const clockInTime = formatDateTime(staff.clock_in_time);
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${staff.name}</td>
        <td>${staff.branch}</td>
        <td>${staff.role}</td>
        <td>${clockInTime}</td>
        <td>${staff.clock_in_location.address}</td>
    `;
    
    activeStaffTable.querySelector('tbody').appendChild(newRow);
}

// Add an active staff member directly to the active staff table (for real-time updates)
function addActiveStaffMember(staffData) {
    if (!activeStaffTable) return;
    
    // Check if there's a placeholder "no active staff" message
    const noStaffRow = activeStaffTable.querySelector('.loading-cell');
    if (noStaffRow) {
        activeStaffTable.innerHTML = ''; // Clear the "no staff" message
    }
    
    // Format clock-in time
    const clockInTime = formatDateTime(staffData.clock_in_time);
    
    // Create a new row
    const newRow = document.createElement('tr');
    newRow.dataset.staffId = staffData.id || '';
    newRow.dataset.staffName = staffData.name || '';
    newRow.className = 'highlighted-new'; // Add highlight class
    
    newRow.innerHTML = `
        <td>${staffData.name}</td>
        <td>${staffData.branch}</td>
        <td>${staffData.role}</td>
        <td>${clockInTime}</td>
        <td>${staffData.clock_in_location.address}</td>
    `;
    
    // Add the new row at the top of the table
    if (activeStaffTable.rows.length > 0) {
        activeStaffTable.insertBefore(newRow, activeStaffTable.rows[0]);
    } else {
        activeStaffTable.appendChild(newRow);
    }
    
    // Remove highlight after animation completes
    setTimeout(() => {
        newRow.classList.remove('highlighted-new');
    }, 5000);
    
    // Make sure the real-time indicator is present
    ensureRealTimeIndicator(activeStaffTable);
}

// Ensure real-time indicator is present for a table
function ensureRealTimeIndicator(table) {
    if (!table) return;
    
    // Find the containing section
    const section = table.closest('.dashboard-section');
    if (!section) return;
    
    // Check if indicator already exists
    if (section.querySelector('.real-time-indicator')) return;
    
    // Find the section header
    const header = section.querySelector('.section-header');
    if (!header) return;
    
    // Create and add the indicator
    const indicator = document.createElement('div');
    indicator.className = 'real-time-indicator';
    indicator.innerHTML = '<span class="indicator-dot"></span> Live';
    header.appendChild(indicator);
    
    // Add animation CSS if it doesn't exist
    if (!document.getElementById('real-time-indicator-styles')) {
        const style = document.createElement('style');
        style.id = 'real-time-indicator-styles';
        style.innerHTML = `
            .real-time-indicator {
                display: inline-flex;
                align-items: center;
                margin-left: 10px;
                font-size: 0.8rem;
                color: #2ecc71;
                font-weight: 500;
            }
            
            .indicator-dot {
                width: 8px;
                height: 8px;
                background-color: #2ecc71;
                border-radius: 50%;
                margin-right: 5px;
                animation: pulse-indicator 2s infinite;
            }
            
            @keyframes pulse-indicator {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
            }
            
            .highlighted-new {
                animation: highlight-row 5s;
            }
            
            @keyframes highlight-row {
                0% { background-color: rgba(46, 204, 113, 0.2); }
                100% { background-color: transparent; }
            }
            
            tr.highlighted-new td {
                transition: background-color 5s;
            }
        `;
        document.head.appendChild(style);
    }
}

// Add real-time indicator to a table
function addRealTimeIndicator(table) {
    // Skip if no table
    if (!table) return;
    
    // Find parent dashboard section
    const section = table.closest('.dashboard-section');
    if (!section) return;
    
    // Skip if real-time indicator already exists
    if (section.querySelector('.real-time-indicator')) return;
    
    // Find the section header
    const header = section.querySelector('.section-header');
    if (!header) return;
    
    // Create the real-time indicator
    const indicatorWrapper = document.createElement('div');
    indicatorWrapper.className = 'real-time-indicator';
    indicatorWrapper.innerHTML = '<span class="pulse-dot"></span> Live';
    
    // Add the indicator to the section header
    header.appendChild(indicatorWrapper);
    
    // Add CSS for the real-time indicator if needed
    if (!document.getElementById('real-time-indicator-css')) {
        const css = document.createElement('style');
        css.id = 'real-time-indicator-css';
        css.textContent = `
            .real-time-indicator {
                display: inline-flex;
                align-items: center;
                margin-left: 10px;
                padding: 3px 8px;
                background-color: rgba(46, 204, 113, 0.1);
                border-radius: 12px;
                font-size: 0.8rem;
                color: #2ecc71;
                font-weight: 500;
            }
            
            .pulse-dot {
                width: 8px;
                height: 8px;
                background-color: #2ecc71;
                border-radius: 50%;
                margin-right: 5px;
                animation: pulse-animation 2s infinite;
            }
            
            @keyframes pulse-animation {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(0.85); }
                100% { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(css);
    }
}