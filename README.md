# Shift Q - Smart Workforce Management

A modern, responsive web application for intelligent workforce management with Firebase integration, featuring real-time clock in/out functionality, leave management, and beautiful animations with a cutting-edge design.

## 🚀 Features

- **Modern UI/UX**: Clean, professional design with smooth animations
- **Real-time Clock**: Live time display with automatic updates
- **Staff Management**: Pre-populated staff names with easy selection
- **Location Tracking**: Automatic GPS location capture for clock in/out events
- **Leave Request System**: Comprehensive leave request form with multiple leave types
- **Firebase Integration**: Real-time data sync and persistent storage
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Interactive Feedback**: Toast notifications and status updates
- **Activity Tracking**: Real-time activity feed showing recent clock ins/outs with locations
- **Button Animations**: Ripple effects and smooth transitions
- **Loading Indicators**: Professional loading overlays
- **Privacy Aware**: Location permission handling with user-friendly messages

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Advanced styling with animations and gradients
- **JavaScript ES6+**: Modern JavaScript with modules
- **Firebase Firestore**: Real-time database for data persistence
- **Font Awesome**: Professional icons
- **Google Fonts**: Beautiful typography with Poppins font

## 📦 Setup Instructions

### Quick Start

1. **Open the setup page**: Open `setup.html` in your browser for guided setup
2. **Or use the batch file**: Double-click `start-server.bat` on Windows to start a local server
3. **Or follow manual setup below**

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Firestore Database
4. Get your Firebase configuration object
5. Replace the placeholder config in `index.html`:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### 2. Firestore Security Rules

Set up the following security rules in Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /timeRecords/{document} {
      allow read, write: if true;
    }
  }
}
```

### 3. Local Development

1. Open `index.html` in a web browser
2. For development, you can use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

## 👥 Staff Management

The application comes with pre-configured staff members:
- John Smith
- Sarah Johnson
- Mike Davis
- Emily Wilson
- David Brown
- Lisa Garcia
- James Miller
- Jessica Taylor

To modify staff names, edit the `<select>` options in `index.html`.

## 🎨 Customization

### Colors
The app uses a gradient color scheme. Main colors can be modified in `styles.css`:
- Primary: `#667eea` to `#764ba2`
- Success: `#4CAF50`
- Error: `#f44336`
- Warning: `#ff9800`

### Animations
All animations are CSS-based and can be customized:
- Slide animations for page load
- Ripple effects for buttons
- Toast notifications
- Loading spinners

### Fonts
The app uses Google Fonts (Poppins). Change the font by updating the import in `index.html` and CSS references.

## 📱 Responsive Design

The application is fully responsive with breakpoints at:
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: 480px - 767px
- Small Mobile: <480px

## 🔧 API Reference

### Firebase Collection Structure

```javascript
timeRecords: {
  staffName: string,
  action: 'clock-in' | 'clock-out',
  timestamp: Firestore Timestamp,
  localTimestamp: ISO String,
  location: {
    latitude: number,
    longitude: number,
    accuracy: number,
    address: string (optional),
    timestamp: ISO String
  }
}

leaveRequests: {
  staffName: string,
  leaveType: 'Annual Leave' | 'Sick Leave' | 'Personal Leave' | 'Emergency Leave' | 'Maternity/Paternity Leave' | 'Study Leave',
  startDate: string (YYYY-MM-DD),
  endDate: string (YYYY-MM-DD),
  reason: string,
  urgent: boolean,
  status: 'pending' | 'approved' | 'rejected',
  submittedAt: Firestore Timestamp,
  localTimestamp: ISO String
}
```

### JavaScript Functions

- `handleClockIn()`: Process clock in action with location capture
- `handleClockOut()`: Process clock out action with location capture
- `getCurrentStaffStatus()`: Check current staff status
- `getCurrentLocation()`: Capture user's GPS coordinates and address
- `reverseGeocode()`: Convert coordinates to readable address
- `requestLocationPermission()`: Handle location permission requests
- `showToast()`: Display notification messages
- `updateStatusDisplay()`: Update status information
- `updateLocationStatus()`: Update location tracking indicator

## 🐛 Troubleshooting

### Firebase Connection Issues
- Verify Firebase configuration is correct
- Check Firestore security rules
- Ensure internet connection is stable

### UI Issues
- Clear browser cache
- Check for JavaScript console errors
- Verify all CSS and JS files are loading

### Performance
- Use modern browsers for best performance
- Enable Firebase persistence for offline capability
- Optimize images and assets if added

## 🔐 Security Considerations

- Implement proper Firebase security rules for production
- Add user authentication if needed
- Validate data on both client and server side
- Use HTTPS in production

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions, please create an issue in the project repository.

---

**TimeTracker Pro** - Making time tracking simple and beautiful! ⏰✨
