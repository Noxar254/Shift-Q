from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from datetime import datetime
import json
import os
import uuid
from geopy.geocoders import Nominatim

app = Flask(__name__)
app.secret_key = 'shiftmanagementsecretkey'

# Data storage paths
DATA_FOLDER = 'data'
STAFF_FILE = os.path.join(DATA_FOLDER, 'staff.json')
SHIFT_FILE = os.path.join(DATA_FOLDER, 'shifts.json')
LEAVE_REQUESTS_FILE = os.path.join(DATA_FOLDER, 'leave_requests.json')
BRANCHES_FILE = os.path.join(DATA_FOLDER, 'branches.json')
ROLES_FILE = os.path.join(DATA_FOLDER, 'roles.json')
SHIFT_CHANGE_REQUESTS_FILE = os.path.join(DATA_FOLDER, 'shift_change_requests.json')

# Create data files if they don't exist
def initialize_data_files():
    # Create data directory if it doesn't exist
    if not os.path.exists(DATA_FOLDER):
        os.makedirs(DATA_FOLDER)
    
    # Initialize staff.json
    if not os.path.exists(STAFF_FILE):
        with open(STAFF_FILE, 'w') as file:
            json.dump({
                "admin": {"name": "Administrator", "password": "admin123", "role": "admin"},
                "john": {"name": "John Doe", "password": "pass123", "role": "staff"},
                "jane": {"name": "Jane Smith", "password": "pass123", "role": "staff"}
            }, file, indent=4)
    
    # Initialize shifts.json
    if not os.path.exists(SHIFT_FILE):
        with open(SHIFT_FILE, 'w') as file:
            json.dump([], file, indent=4)
    
    # Initialize leave_requests.json
    if not os.path.exists(LEAVE_REQUESTS_FILE):
        with open(LEAVE_REQUESTS_FILE, 'w') as file:
            json.dump([], file, indent=4)
    
    # Initialize branches.json
    if not os.path.exists(BRANCHES_FILE):
        with open(BRANCHES_FILE, 'w') as file:
            json.dump({
                "branch1": {"name": "Headquarters", "location": "New York"},
                "branch2": {"name": "Downtown Office", "location": "Chicago"},
                "branch3": {"name": "West Coast", "location": "San Francisco"}
            }, file, indent=4)
    
    # Initialize roles.json
    if not os.path.exists(ROLES_FILE):
        with open(ROLES_FILE, 'w') as file:
            json.dump({
                "manager": {"name": "Manager"},
                "supervisor": {"name": "Supervisor"},
                "associate": {"name": "Associate"}
            }, file, indent=4)
    
    # Initialize shift_change_requests.json
    if not os.path.exists(SHIFT_CHANGE_REQUESTS_FILE):
        with open(SHIFT_CHANGE_REQUESTS_FILE, 'w') as file:
            json.dump([], file, indent=4)

# Helper functions for data operations
def load_data(filepath):
    try:
        with open(filepath, 'r') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {} if filepath in [STAFF_FILE, BRANCHES_FILE, ROLES_FILE] else []

def save_data(data, filepath):
    with open(filepath, 'w') as file:
        json.dump(data, file, indent=4)

def get_location_name(lat, lng):
    try:
        geolocator = Nominatim(user_agent="shift_management_system")
        location = geolocator.reverse(f"{lat}, {lng}")
        return location.address if location else "Unknown"
    except:
        return "Location service unavailable"

# Routes
@app.route('/')
def index():
    if 'username' in session and session.get('user_role') == 'admin':
        return redirect(url_for('admin_dashboard'))
    elif 'username' in session and session.get('user_role') == 'staff':
        return redirect(url_for('staff_dashboard'))
    
    # Show portal landing page
    return render_template('login.html')

@app.route('/admin_login')
def admin_login():
    # Show admin login page
    return render_template('admin_login.html')

@app.route('/admin_auth', methods=['POST'])
def admin_auth():
    username = request.form.get('username')
    password = request.form.get('password')
    users = load_data(STAFF_FILE)
    
    if username in users and users[username]['role'] == 'admin' and users[username]['password'] == password:
        session['username'] = username
        session['user_role'] = 'admin'
        session['name'] = users[username]['name']
        return redirect(url_for('admin_dashboard'))
    
    return render_template('admin_login.html', error="Invalid administrator credentials")

@app.route('/staff_auth', methods=['POST'])
def staff_auth():
    username = request.form.get('username')
    password = request.form.get('password')
    users = load_data(STAFF_FILE)
    
    if username in users and users[username]['role'] == 'staff' and users[username]['password'] == password:
        session['username'] = username
        session['user_role'] = 'staff'
        session['name'] = users[username]['name']
        return redirect(url_for('staff_dashboard'))
    
    return render_template('login.html', error="Invalid staff credentials")

@app.route('/logout')
def logout():
    session.pop('username', None)
    session.pop('user_role', None)
    session.pop('name', None)
    return redirect(url_for('index'))

@app.route('/staff_dashboard')
def staff_dashboard():
    # Check if user is authenticated
    if 'username' not in session:
        return redirect(url_for('index'))
    
    # Load required data for the staff dashboard
    branches = load_data(BRANCHES_FILE)
    roles = load_data(ROLES_FILE)
    staff = load_data(STAFF_FILE)
    
    return render_template('staff_dashboard.html', 
                          branches=branches, 
                          roles=roles,
                          staff_list=staff,
                          current_user=session['username'])

@app.route('/set_staff', methods=['POST'])
def set_staff():
    """Set the current staff member in the session"""
    data = request.json
    username = data.get('username')
    
    if not username:
        return jsonify({"status": "error", "message": "No username provided"}), 400
    
    staff = load_data(STAFF_FILE)
    if username in staff and staff[username]['role'] == 'staff':
        session['username'] = username
        session['name'] = staff[username]['name']
        session['user_role'] = 'staff'
        return jsonify({"status": "success", "name": staff[username]['name']})
    
    return jsonify({"status": "error", "message": "Invalid staff selection"}), 400

@app.route('/admin_dashboard')
def admin_dashboard():
    if 'username' not in session:
        return redirect(url_for('admin_login'))
    
    # Check if the user is an admin
    if session.get('user_role') == 'admin':
        return render_template('admin_dashboard.html')
    
    # If the user is logged in but not an admin, check if their account has admin privileges
    users = load_data(STAFF_FILE)
    username = session.get('username')
    
    if username in users and users[username].get('role') == 'admin':
        # Update the session with admin role
        session['user_role'] = 'admin'
        return render_template('admin_dashboard.html')
    
    # If not an admin, redirect to admin login
    return redirect(url_for('admin_login'))

@app.route('/clock_in', methods=['POST'])
def clock_in():
    if 'username' not in session or session['username'] == 'guest':
        return jsonify({"status": "error", "message": "Please select your name first"}), 400
    
    data = request.json
    username = session['username']
    branch_id = data.get('branch')
    role_id = data.get('role')
    lat = data.get('latitude')
    lng = data.get('longitude')
    
    shifts = load_data(SHIFT_FILE)
    branches = load_data(BRANCHES_FILE)
    roles = load_data(ROLES_FILE)
    
    # Create new shift entry
    shift_entry = {
        "id": str(uuid.uuid4()),
        "username": username,
        "name": session['name'],
        "branch": branches[branch_id]['name'] if branch_id in branches else "Unknown",
        "role": roles[role_id]['name'] if role_id in roles else "Unknown",
        "clock_in_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "clock_out_time": None,
        "clock_in_location": {
            "latitude": lat,
            "longitude": lng,
            "address": get_location_name(lat, lng)
        },
        "clock_out_location": None
    }
    
    shifts.append(shift_entry)
    save_data(shifts, SHIFT_FILE)
    
    return jsonify({"status": "success", "shift": shift_entry})

@app.route('/clock_out', methods=['POST'])
def clock_out():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    data = request.json
    shift_id = data.get('shift_id')
    lat = data.get('latitude')
    lng = data.get('longitude')
    
    shifts = load_data(SHIFT_FILE)
    
    # Find and update the shift
    for shift in shifts:
        if shift['id'] == shift_id and shift['username'] == session['username']:
            shift['clock_out_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            shift['clock_out_location'] = {
                "latitude": lat,
                "longitude": lng,
                "address": get_location_name(lat, lng)
            }
            save_data(shifts, SHIFT_FILE)
            return jsonify({"status": "success", "shift": shift})
    
    return jsonify({"status": "error", "message": "Shift not found"}), 404

@app.route('/request_leave', methods=['POST'])
def request_leave():
    if 'username' not in session or session['username'] == 'guest':
        return jsonify({"status": "error", "message": "Please select your name first"}), 400
    
    data = request.json
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    reason = data.get('reason')
    
    leave_requests = load_data(LEAVE_REQUESTS_FILE)
    
    # Create new leave request
    leave_request = {
        "id": str(uuid.uuid4()),
        "username": session['username'],
        "name": session['name'],
        "start_date": start_date,
        "end_date": end_date,
        "reason": reason,
        "status": "pending",
        "submitted_on": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    leave_requests.append(leave_request)
    save_data(leave_requests, LEAVE_REQUESTS_FILE)
    
    return jsonify({"status": "success", "leave_request": leave_request})

@app.route('/get_shifts', methods=['GET'])
def get_shifts():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    shifts = load_data(SHIFT_FILE)
    
    # Filter shifts based on user role
    if session['user_role'] == 'admin':
        # Admin sees all shifts
        return jsonify({"status": "success", "shifts": shifts})
    else:
        # Staff sees only their own shifts
        user_shifts = [shift for shift in shifts if shift['username'] == session['username']]
        return jsonify({"status": "success", "shifts": user_shifts})

@app.route('/get_leave_requests', methods=['GET'])
def get_leave_requests():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    leave_requests = load_data(LEAVE_REQUESTS_FILE)
    
    # Filter leave requests based on user role
    if session['user_role'] == 'admin':
        # Admin sees all leave requests
        return jsonify({"status": "success", "leave_requests": leave_requests})
    else:
        # Staff sees only their own leave requests
        user_leave_requests = [request for request in leave_requests if request['username'] == session['username']]
        return jsonify({"status": "success", "leave_requests": user_leave_requests})

@app.route('/approve_leave', methods=['POST'])
def approve_leave():
    if 'username' not in session or session['user_role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    data = request.json
    leave_id = data.get('leave_id')
    status = data.get('status')  # "approved" or "rejected"
    
    leave_requests = load_data(LEAVE_REQUESTS_FILE)
    
    # Find and update the leave request
    for leave_request in leave_requests:
        if leave_request['id'] == leave_id:
            leave_request['status'] = status
            leave_request['reviewed_by'] = session['username']
            leave_request['reviewed_on'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            save_data(leave_requests, LEAVE_REQUESTS_FILE)
            return jsonify({"status": "success", "leave_request": leave_request})
    
    return jsonify({"status": "error", "message": "Leave request not found"}), 404

@app.route('/get_shift_change_requests', methods=['GET'])
def get_shift_change_requests():
    """Get all shift change requests or filter by user if staff"""
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    shift_change_requests = load_data(SHIFT_CHANGE_REQUESTS_FILE)
    
    # Filter shift change requests based on user role
    if session['user_role'] == 'admin':
        # Admin sees all shift change requests
        return jsonify({"status": "success", "shift_change_requests": shift_change_requests})
    else:
        # Staff sees only their own requests or ones where they are the target
        user_shift_change_requests = [
            request for request in shift_change_requests 
            if request['requesting_username'] == session['username'] or request['target_username'] == session['username']
        ]
        return jsonify({"status": "success", "shift_change_requests": user_shift_change_requests})

@app.route('/request_shift_change', methods=['POST'])
def request_shift_change():
    """Create a new shift change request"""
    if 'username' not in session or session['username'] == 'guest':
        return jsonify({"status": "error", "message": "Please select your name first"}), 400
    
    data = request.json
    shift_id = data.get('shift_id')  # Requesting staff's shift ID
    target_username = data.get('target_username')  # Username of staff to swap with
    target_shift_id = data.get('target_shift_id')  # Target staff's shift ID
    reason = data.get('reason')
    
    # Validate required fields
    if not all([shift_id, target_username, reason]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
    
    # Load staff data
    staff = load_data(STAFF_FILE)
    if target_username not in staff:
        return jsonify({"status": "error", "message": "Target staff not found"}), 404
    
    # Load shifts
    shifts = load_data(SHIFT_FILE)
    requesting_shift = next((shift for shift in shifts if shift['id'] == shift_id), None)
    
    if not requesting_shift:
        return jsonify({"status": "error", "message": "Shift not found"}), 404
    
    # If target shift ID is provided, validate it
    target_shift = None
    if target_shift_id:
        target_shift = next((shift for shift in shifts if shift['id'] == target_shift_id), None)
        if not target_shift:
            return jsonify({"status": "error", "message": "Target shift not found"}), 404
    
    # Create shift change request
    shift_change_request = {
        "id": str(uuid.uuid4()),
        "requesting_username": session['username'],
        "requesting_name": session['name'],
        "shift_id": shift_id,
        "shift_details": {
            "date": requesting_shift['clock_in_time'].split()[0],
            "time": requesting_shift['clock_in_time'].split()[1],
            "branch": requesting_shift['branch'],
            "role": requesting_shift['role']
        },
        "target_username": target_username,
        "target_name": staff[target_username]['name'],
        "target_shift_id": target_shift_id,
        "target_shift_details": {
            "date": target_shift['clock_in_time'].split()[0] if target_shift else None,
            "time": target_shift['clock_in_time'].split()[1] if target_shift else None,
            "branch": target_shift['branch'] if target_shift else None,
            "role": target_shift['role'] if target_shift else None
        } if target_shift_id else None,
        "reason": reason,
        "status": "pending",
        "target_accepted": False,
        "admin_approved": False,
        "submitted_on": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Save the request
    shift_change_requests = load_data(SHIFT_CHANGE_REQUESTS_FILE)
    shift_change_requests.append(shift_change_request)
    save_data(shift_change_requests, SHIFT_CHANGE_REQUESTS_FILE)
    
    return jsonify({"status": "success", "shift_change_request": shift_change_request})

@app.route('/respond_to_shift_change', methods=['POST'])
def respond_to_shift_change():
    """Target staff responds to shift change request"""
    if 'username' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    data = request.json
    request_id = data.get('request_id')
    accept = data.get('accept')  # Boolean
    
    if not isinstance(accept, bool):
        return jsonify({"status": "error", "message": "Invalid response parameter"}), 400
    
    # Load shift change requests
    shift_change_requests = load_data(SHIFT_CHANGE_REQUESTS_FILE)
    
    # Find the request
    for request in shift_change_requests:
        if request['id'] == request_id and request['target_username'] == session['username']:
            request['target_accepted'] = accept
            request['target_responded_on'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Update status
            if not accept:
                request['status'] = "rejected_by_staff"
            else:
                # If target accepted, request is awaiting admin approval
                request['status'] = "awaiting_admin"
                
            save_data(shift_change_requests, SHIFT_CHANGE_REQUESTS_FILE)
            return jsonify({"status": "success", "shift_change_request": request})
    
    return jsonify({"status": "error", "message": "Shift change request not found or not targeted at you"}), 404

@app.route('/approve_shift_change', methods=['POST'])
def approve_shift_change():
    """Admin approves or rejects a shift change request"""
    if 'username' not in session or session['user_role'] != 'admin':
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    data = request.json
    request_id = data.get('request_id')
    approve = data.get('approve')  # Boolean
    
    if not isinstance(approve, bool):
        return jsonify({"status": "error", "message": "Invalid approval parameter"}), 400
    
    # Load shift change requests
    shift_change_requests = load_data(SHIFT_CHANGE_REQUESTS_FILE)
    
    # Find the request
    for request in shift_change_requests:
        if request['id'] == request_id:
            request['admin_approved'] = approve
            request['admin_username'] = session['username']
            request['admin_responded_on'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Update status
            if approve:
                request['status'] = "approved"
                
                # If we need to update the actual shifts, we would do that here
                # This might involve updating clock-in records or shift assignments
                
            else:
                request['status'] = "rejected_by_admin"
                
            save_data(shift_change_requests, SHIFT_CHANGE_REQUESTS_FILE)
            return jsonify({"status": "success", "shift_change_request": request})
    
    return jsonify({"status": "error", "message": "Shift change request not found"}), 404

# Run the app
if __name__ == '__main__':
    initialize_data_files()
    app.run(debug=True)