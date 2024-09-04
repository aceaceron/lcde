// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

// Function to format the given date as 'yyMMdd'
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // Last two digits of the year
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month (01-12)
    const datePart = String(date.getDate()).padStart(2, '0'); // Date (01-31)
    return `${year}${month}${datePart}`;
}

// Function to get the next sequential number for the date key
async function getNextSequentialNumber(dateKey) {
    const countRef = ref(db, `_countForReservation/${dateKey}`);

    try {
        const snapshot = await get(countRef);
        let count = 0;
        if (snapshot.exists()) {
            count = snapshot.val();
        }
        const nextCount = count + 1;
        await set(countRef, nextCount);
        return nextCount;
    } catch (error) {
        console.error('Error getting next sequential number:', error);
        throw error;
    }
}

// Function to generate a unique ID based on the reservation date and a sequential number
async function generateReservationId(reservationDate) {
    const dateKey = formatDate(reservationDate);
    const sequentialNumber = await getNextSequentialNumber(dateKey);
    // Format sequential number with leading zeros
    const formattedNumber = String(sequentialNumber).padStart(2, '0');
    return `${dateKey}-${formattedNumber}`;
}

function formatDateForDatabase(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // Month (1-12) without leading zero
    const day = date.getDate(); // Date (1-31) without leading zero
    const year = date.getFullYear(); // Full year (YYYY)
    return `${month}/${day}/${year}`;
}

// Constants for base rates
const BASE_RATE_NON_AIRCON = { 3: 300, 6: 500, 24: 1000 };
const BASE_RATE_AIRCON = { 3: 500, 6: 800, 24: 1500 };

// Constants for additional fees
const ADDITIONAL_FEE_NON_AIRCON = 200;
const ADDITIONAL_FEE_AIRCON = 250;
const ADDITIONAL_EXTENSIONFEE_NON_AIRCON = 100;
const ADDITIONAL_EXTENSIONFEE_AIRCON = 150;

// Function to calculate the amount to pay
function calculateAmountToPay(roomType, duration, extension, numberOfGuests) {
    let baseRate;
    let additionalFeePerGuest;
    let extensionFeePerHour;

    if (roomType === 'AIR-CONDITIONED ROOM') {
        baseRate = BASE_RATE_AIRCON[duration];
        additionalFeePerGuest = ADDITIONAL_FEE_AIRCON;
        extensionFeePerHour = ADDITIONAL_EXTENSIONFEE_AIRCON;
    } else if (roomType === 'STANDARD ROOM') {
        baseRate = BASE_RATE_NON_AIRCON[duration];
        additionalFeePerGuest = ADDITIONAL_FEE_NON_AIRCON;
        extensionFeePerHour = ADDITIONAL_EXTENSIONFEE_NON_AIRCON;
    } else {
        throw new Error('Unknown room type');
    }

    // Calculate additional fees for guests more than 2
    const additionalGuestFees = (numberOfGuests > 2) ? (numberOfGuests - 2) * additionalFeePerGuest : 0;

    // Calculate extension fees
    const extensionFees = extension * extensionFeePerHour;

    // Total amount to pay
    const totalAmount = baseRate + additionalGuestFees + extensionFees;
    return totalAmount;
}

// Event listener for form submission
document.querySelector('.confirm').addEventListener('click', async function (event) {
    event.preventDefault();

    showLoadingScreen();

    const lastName = document.getElementById('lastName');
    const firstName = document.getElementById('firstName');
    const phoneNumber = document.getElementById('phoneNumber');
    const emailAddress = document.getElementById('emailAddress');
    const date = document.getElementById('date');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const startingTime = document.getElementById("dropdownTime");
    const roomType = document.getElementById("dropdown0");
    const duration = document.getElementById("dropdown1");
    const extension = document.getElementById("dropdown2");
    const numberOfGuests = document.getElementById("numOfGuest");

    let valid = true;

    // Validation checks
    if (lastName.value.trim() === "") {
        lastName.classList.add('error');
        valid = false;
    } else {
        lastName.classList.remove('error');
    }

    if (firstName.value.trim() === "") {
        firstName.classList.add('error');
        valid = false;
    } else {
        firstName.classList.remove('error');
    }

    if (phoneNumber.value.trim() === "") {
        phoneNumber.classList.add('error');
        valid = false;
    } else {
        phoneNumber.classList.remove('error');
    }

    if (emailAddress.value.trim() === "" || !emailAddress.checkValidity()) {
        emailAddress.classList.add('error');
        valid = false;
    } else {
        emailAddress.classList.remove('error');
    }

    if (date.value.trim() === "") {
        date.classList.add('error');
        valid = false;
    } else {
        date.classList.remove('error');
    }

    if (numberOfGuests.value < 1 ||  numberOfGuests.value > 6) {
        numberOfGuests.classList.add('error');
        valid = false;
        alert("Invalid value. Number of guests minimum is 1 and maximum of 6.");
    } else {
        numberOfGuests.classList.remove('error');
    }

    if (!termsCheckbox.checked) {
        termsCheckbox.classList.add('error');
        valid = false;
    } else {
        termsCheckbox.classList.remove('error');
    }

    if (valid) {
        try {
            const reservationId = await generateReservationId(date.value);
            const reservationRef = ref(db, `activeReservations/${date.value}/${reservationId}`);
            
            const durationValue = parseInt(duration.value, 10) || 0;
            const extensionValue = parseInt(extension.value, 10) || 0;
            const numberOfGuestsValue = parseInt(numberOfGuests.value, 10) || 0;

            // Calculate the total amount to pay
            const amountToPay = calculateAmountToPay(roomType.value, durationValue, extensionValue, numberOfGuestsValue);
            
            const formattedDate = formatDateForDatabase(date.value);

            await set(reservationRef, {
                lastName: lastName.value,
                firstName: firstName.value,
                phoneNumber: phoneNumber.value,
                emailAddress: emailAddress.value,
                reservationCheckInDate: formattedDate,
                reservationCheckInTime: startingTime.value,
                roomType: roomType.value,
                duration: durationValue,
                extension: extensionValue,
                numberOfGuests: numberOfGuestsValue,
                amountToPay: amountToPay
            });
            alert(`Good day Ma'am/Sir ${firstName.value}! Your reservation form has been successfully submitted. Please take a screenshot of this window.\nReservation ID: ${reservationId} \nAmount to pay when arrived: PHP ${amountToPay}.00`);

            // Clear form fields
            lastName.value = '';
            firstName.value = '';
            phoneNumber.value = '';
            emailAddress.value = '';
            date.value = '';
            numberOfGuests.value = '2';
            termsCheckbox.checked = false;
        } catch (error) {
            console.error("Error writing to Firebase: ", error);
            hideLoadingScreenLoadingScreen();
        } finally {
            // Hide the loading screen
            hideLoadingScreen();
        }
    } else {
        alert("Please fill out all required fields correctly and/or agree to the terms and conditions.");
        hideLoadingScreen();
    }
});

function showLoadingScreen() {
    console.log('Showing loading screen');
    document.getElementById('loadingScreen').style.display = 'block';
}

function hideLoadingScreen() {
    console.log('Hiding loading screen');
    document.getElementById('loadingScreen').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    hideLoadingScreen();
});