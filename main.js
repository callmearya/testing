import { database } from './firebase.js';

function fetchRooms() {
    const roomsRef = database.ref('realtimeCalls');
    roomsRef.once('value', (snapshot) => {
        const rooms = snapshot.val();
        const roomsDiv = document.getElementById('rooms');
        roomsDiv.innerHTML = ''; // Clear existing buttons

        if (rooms) {
            Object.keys(rooms).forEach((roomCode) => {
                const button = document.createElement('button');
                button.textContent = `Join Room ${roomCode}`;
                button.onclick = () => joinRoom(roomCode);
                roomsDiv.appendChild(button);
            });
        } else {
            roomsDiv.innerHTML = '<p>No active rooms available.</p>';
        }
    });
}

function joinRoom(roomCode) {
    // Construct the URL for the third URL with the room code as a query parameter
    const joinUrl = `https://patientsidetesting.netlify.app/?room=${encodeURIComponent(roomCode)}`;
    
    // Redirect to the third URL with the room code
    window.location.href = joinUrl;
}

// Fetch rooms on page load
fetchRooms();
