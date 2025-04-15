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
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }
    
    // Update time element if it exists
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = formattedTime;
    }
}

// Update time immediately and then every second
updateDateTime();
setInterval(updateDateTime, 1000);