// datetime.js - Time utilities for Shift Q
// Cached DOM references to improve performance
let dateElement = null;
let timeElement = null; 

// Function to update the date and time display
function updateDateTime() {
    const now = new Date();
    
    // Format date: Month Day, Year (e.g., April 15, 2025)
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', dateOptions);
    
    // Format time: HH:MM:SS AM/PM (e.g., 10:30:45 AM)
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
    
    // Update date element if it exists
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }
    
    // Update time element if it exists
    if (timeElement) {
        timeElement.textContent = formattedTime;
    }
}

// Initialize DOM references once on page load
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM references
    dateElement = document.getElementById('current-date');
    timeElement = document.getElementById('current-time');
    
    // Update time immediately 
    updateDateTime();
    
    // Set up interval for updates
    setInterval(updateDateTime, 1000);
});

// Helper function for calculating time duration between two datetime strings
function calculateDuration(startDateTime, endDateTime) {
    const start = new Date(startDateTime);
    const end = endDateTime ? new Date(endDateTime) : new Date();
    
    // Calculate duration in milliseconds
    const durationMs = end - start;
    
    // Convert to seconds
    const durationSec = Math.floor(durationMs / 1000);
    
    // Extract hours, minutes, seconds
    const hours = Math.floor(durationSec / 3600);
    const minutes = Math.floor((durationSec % 3600) / 60);
    const seconds = durationSec % 60;
    
    // Format the duration string
    let durationStr = '';
    if (hours > 0) {
        durationStr += `${hours}h `;
    }
    durationStr += `${minutes}m`;
    
    return {
        hours,
        minutes,
        seconds,
        totalSeconds: durationSec,
        formatted: durationStr
    };
}

// Format date only
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format date and time
function formatDateTime(dateTimeStr) {
    const dateTime = new Date(dateTimeStr);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    return `${dateTime.toLocaleDateString('en-US', dateOptions)} ${dateTime.toLocaleTimeString('en-US', timeOptions)}`;
}

// Format relative time (e.g. "2 hours ago", "just now", etc.)
function formatRelativeTime(dateTimeStr) {
    const dateTime = new Date(dateTimeStr);
    const now = new Date();
    const diffMs = now - dateTime;
    const diffSec = Math.floor(diffMs / 1000);
    
    // Less than a minute
    if (diffSec < 60) {
        return 'just now';
    }
    
    // Less than an hour
    if (diffSec < 3600) {
        const minutes = Math.floor(diffSec / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diffSec < 86400) {
        const hours = Math.floor(diffSec / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diffSec < 604800) {
        const days = Math.floor(diffSec / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Default: return formatted date
    return formatDate(dateTimeStr);
}