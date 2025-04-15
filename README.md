# Shift Q - Shift Management System

Shift Q is a robust shift management system built with Python Flask backend and HTML/CSS/JavaScript frontend. It provides real-time tracking of employee clock ins/outs, location tracking, leave request management, and payroll processing.

## Features

- **Real-time Date and Time Display** - Shows current date and time on both staff and admin interfaces
- **Real-time Location Tracking** - Captures staff location during clock in/out
- **Staff Dashboard**
  - Simple interface for clocking in and out
  - Staff name selection via dropdown
  - Office branch selection via dropdown
  - Role selection via dropdown
  - Leave request submission
  - View shift history and leave request status
  - Request shift changes or swaps
- **Admin Dashboard**
  - Real-time monitoring of staff activities
  - Manage staff, branches, and roles
  - Review and approve/reject leave requests
  - Review and manage shift change requests
  - Export shift data to CSV
  - View real-time staff locations on interactive map
  - Comprehensive notification system
  - Filter and search capabilities
  - Team chat functionality for quick communication
  - Dark mode support
- **Payroll Processing**
  - Automatic calculation of hours worked
  - Overtime tracking
  - Generate payroll reports
  - Export payroll data

## Installation and Setup

### Prerequisites
- Python 3.6+
- pip package manager
- Modern web browser with geolocation support

### Steps to Install and Run

1. Clone this repository to your local machine

2. Install required packages:
```
pip install flask geopy
```

3. Run the application:
```
python app.py
```

4. Open your web browser and go to `http://127.0.0.1:5000`

### Default Login Credentials

#### Admin Account
- Username: admin
- Password: admin123

#### Staff Accounts
- Username: john
- Password: pass123

- Username: jane
- Password: pass123

## System Requirements

- **Server**: Any system capable of running Python 3.6+
- **Client**: Modern web browser (Chrome, Firefox, Edge, Safari)
- **Internet Connection**: Required for geolocation and reverse geocoding
- **Storage**: Minimal (~10MB for application, varies based on user data)

## Directory Structure

- `/static` - All static assets (CSS, JavaScript, images)
  - `/css` - CSS stylesheets
  - `/js` - JavaScript files including admin.js, staff.js, and datetime.js
  - `/images` - Image assets
- `/templates` - HTML templates for all interfaces
- `/data` - JSON files for data storage (auto-created on first run)
  - branches.json - Store branch information
  - leave_requests.json - Track leave requests
  - roles.json - Define available roles
  - shifts.json - Record of all shifts
  - staff.json - Staff information
  - shift_change_requests.json - Track shift swap requests
  - payroll.json - Payroll calculations and history

## Technologies Used

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **UI Design**: Custom CSS with responsive design
- **Icons**: Font Awesome
- **Location Services**: Geolocation API, Nominatim for reverse geocoding
- **Data Storage**: JSON files (can be extended to use a database)

## How to Use

### Staff Interface
1. Login with staff credentials
2. Select your branch and role
3. Click "Clock In" to start your shift
4. Click "Clock Out" when your shift is complete
5. Use "Request Leave" to submit leave requests
6. Use "Request Shift Change" to swap shifts with colleagues

### Admin Interface
1. Login with admin credentials
2. View real-time data on the dashboard
3. Use the sidebar to navigate between sections
   - Dashboard: Overview of current activities
   - Staff: Manage staff members
   - Shifts: View all shifts and manage shift change requests
   - Leave Requests: Approve or reject leave requests
   - Notifications: System notifications and alerts
   - Settings: Manage branches and roles
4. Use the team chat for quick communication with staff
5. Toggle dark mode for comfortable viewing in different lighting conditions

## Future Enhancements

- Database integration for data persistence
- Mobile application support
- Advanced reporting and analytics
- Enhanced scheduling and shift planning capabilities
- Integration with external payroll systems
- Biometric clock-in options
- Employee performance tracking
- Multi-language support

## License

This project is licensed under the MIT License.

## Last Updated

April 15, 2025