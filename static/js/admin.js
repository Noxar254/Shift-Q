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
            }
        });
    }
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
            <tr>
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

// Display pending leave requests in dashboard
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
        html += `
            <tr>
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
    });
    
    leaveRequestsTable.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('#leave-requests-table .btn-action').forEach(btn => {
        btn.addEventListener('click', handleLeaveAction);
    });
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