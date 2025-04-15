# Shift Q - Shift Management System

Shift Q is a robust shift management system built with Python Flask backend and HTML/CSS/JavaScript frontend. It provides real-time tracking of employee clock ins/outs, location tracking, and leave request management.

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
- **Admin Dashboard**
  - Real-time monitoring of staff activities
  - Manage staff, branches, and roles
  - Review and approve/reject leave requests
  - Export shift data to CSV
  - View real-time staff locations
  - Filter and search capabilities

## Installation and Setup

### Prerequisites
- Python 3.6+
- pip package manager

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

## Directory Structure

- `/static` - All static assets (CSS, JavaScript, images)
  - `/css` - CSS stylesheets
  - `/js` - JavaScript files
  - `/images` - Image assets
- `/templates` - HTML templates
- `/data` - JSON files for data storage (auto-created on first run)

## Technologies Used

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **Location Services**: Geolocation API, Nominatim for reverse geocoding
- **Data Storage**: JSON files (can be extended to use a database)

## How to Use

### Staff Interface
1. Login with staff credentials
2. Select your branch and role
3. Click "Clock In" to start your shift
4. Click "Clock Out" when your shift is complete
5. Use "Request Leave" to submit leave requests

### Admin Interface
1. Login with admin credentials
2. View real-time data on the dashboard
3. Use the sidebar to navigate between sections
4. Approve or reject leave requests
5. Manage staff, branches, and roles in the settings

## Future Enhancements

- Database integration for data persistence
- Mobile application support
- Advanced reporting and analytics
- Scheduling and shift planning capabilities
- Integration with payroll systems

## License

This project is licensed under the MIT License.