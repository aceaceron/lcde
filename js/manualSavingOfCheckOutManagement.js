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

document.getElementById('mbCheckInDate').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
    if (value.length > 4) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
    } else if (value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
    }
    e.target.value = value;
});

// Constants for fees and rates
const airConRooms = ['2', '4', '6', '8', '9', '10'];
// Constants for additional fees per guest above 2
const ADDITIONAL_FEE_NON_AIRCON = 200;
const ADDITIONAL_FEE_AIRCON = 250;


// Constants for additional fees
const ADDITIONAL_EXTENSIONFEE_NON_AIRCON = 100;
const ADDITIONAL_EXTENSIONFEE_AIRCON = 150;

// Base rates for different durations
const BASE_RATE_NON_AIRCON = { 3: 300, 6: 500, 24: 1000 };
const BASE_RATE_AIRCON = { 3: 500, 6: 800, 24: 1500 };

function calculateAndUpdateValues() {
    // Get input values
    const checkInDate = document.getElementById('mbCheckInDate').value;
    const checkInTime = document.getElementById('mbCheckInTime').value;
    const roomNum = document.getElementById('mbRoomNum').value;
    const numberOfGuests = parseInt(document.getElementById('mbNumOfGuests').value, 10);
    const extension = parseInt(document.getElementById('mbExtension').value, 10) || 0;
    const initialDuration = parseInt(document.getElementById('mbInitialDuration').value, 10);

    if (!checkInDate || !checkInTime || !roomNum || isNaN(numberOfGuests) || isNaN(initialDuration)) {
        return; // Exit if required inputs are missing
    }

    // Determine if the room is air-conditioned or standard based on room number
    const isAirCon = airConRooms.includes(roomNum);
    const baseRate = isAirCon ? BASE_RATE_AIRCON[initialDuration] : BASE_RATE_NON_AIRCON[initialDuration];
    const additionalGuestFee = isAirCon ? ADDITIONAL_FEE_AIRCON : ADDITIONAL_FEE_NON_AIRCON;
    const extensionFee = isAirCon ? ADDITIONAL_EXTENSIONFEE_AIRCON : ADDITIONAL_EXTENSIONFEE_NON_AIRCON;

    // Calculate additional guest fees if guests > 2
    const extraGuests = Math.max(0, numberOfGuests - 2);
    const totalAdditionalFee = extraGuests * additionalGuestFee;

    // Calculate extension fee
    const totalExtensionFee = extension * extensionFee;

    // Calculate total amount
    const totalAmountPaid = baseRate + totalAdditionalFee + totalExtensionFee;

    // Calculate total duration (initial + extension)
    const totalDuration = initialDuration + extension;

    // Calculate check-out date and time
    const checkInDateTime = new Date(`${checkInDate} ${checkInTime}`);
    checkInDateTime.setHours(checkInDateTime.getHours() + totalDuration); // Add the total duration

    // Format check-out date and time
    const checkOutDate = checkInDateTime.toLocaleDateString('en-US');
    const checkOutTime = checkInDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Set calculated values to inputs
    document.getElementById('mbCheckOutDate').value = checkOutDate;
    document.getElementById('mbCheckOutTime').value = checkOutTime;
    document.getElementById('mbTotalDuration').value = totalDuration;
    document.getElementById('mbTotalAmountPaid').value = totalAmountPaid.toFixed(2); // Two decimal places for currency
}

// Add event listeners to relevant inputs
document.getElementById('mbCheckInDate').addEventListener('input', calculateAndUpdateValues);
document.getElementById('mbCheckInTime').addEventListener('input', calculateAndUpdateValues);
document.getElementById('mbRoomNum').addEventListener('change', calculateAndUpdateValues);
document.getElementById('mbNumOfGuests').addEventListener('change', calculateAndUpdateValues);
document.getElementById('mbExtension').addEventListener('input', calculateAndUpdateValues);
document.getElementById('mbInitialDuration').addEventListener('change', calculateAndUpdateValues);

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