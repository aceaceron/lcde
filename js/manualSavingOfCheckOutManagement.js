// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { saveCheckInData } from './checkInCheckOutManagement.js';

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyB3ueNqM29tpPKOsGyZ94uuYMFhkfXrT3M",
    authDomain: "lcdedb.firebaseapp.com",
    databaseURL: "https://lcdedb-default-rtdb.firebaseio.com",
    projectId: "lcdedb",
    storageBucket: "lcdedb.appspot.com",
    messagingSenderId: "113814487086",
    appId: "1:113814487086:web:a03f7044d7f838a8151fbf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app); // Initialize the Realtime Database


document.querySelector('#saveManualBooking').addEventListener('click', async function () {
    const saveBooking = confirm('Are you sure the data is correct and accurate?\nThis action cannot be undone once saved.');

    if (saveBooking) {
        // Get input values
        const checkInDate = document.getElementById('mbCheckInDate').value;
        const checkInTime = document.getElementById('mbCheckInTime').value;
        const checkOutDate = document.getElementById('mbCheckOutDate').value;
        const checkOutTime = document.getElementById('mbCheckOutTime').value;
        const roomNum = document.getElementById('mbRoomNum').value;

        // Convert numeric inputs
        const numberOfGuests = parseInt(document.getElementById('mbNumOfGuests').value, 10);
        const extension = parseInt(document.getElementById('mbExtension').value, 10);
        const initialDuration = parseInt(document.getElementById('mbInitialDuration').value, 10);
        const totalDuration = parseInt(document.getElementById('mbTotalDuration').value, 10);
        const totalAmountPaid = parseFloat(document.getElementById('mbTotalAmountPaid').value);

        try {
            // Save the check-in data
            await saveCheckInData(
                roomNum,
                initialDuration,
                checkInDate,
                checkInTime,
                checkOutDate,
                checkOutTime,
                extension,
                totalDuration,
                numberOfGuests,
                totalAmountPaid,
                true
            );
        } catch (error) {
        }
    }
});