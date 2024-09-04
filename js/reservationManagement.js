// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get, remove, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getRoomState, saveRoomState, saveCheckInData } from './checkInCheckOutManagement.js';

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

function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

// Function to hide the loading screen
function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

// Function to fetch and display reservations
export async function displayReservations() {
    const reservationDiv = document.querySelector('.reservation');
    showLoadingScreen();

    const currentFile = window.location.pathname.split('/').pop();

    try {
        const reservationsRef = ref(db, 'activeReservations');
        const snapshot = await get(reservationsRef);

        if (snapshot.exists()) {
            hideLoadingScreen();
            const reservations = snapshot.val();
            reservationDiv.innerHTML = '';

            for (const [date, reservationsByDate] of Object.entries(reservations)) {
                for (const [reservationId, reservationData] of Object.entries(reservationsByDate)) {
                    const reservationDivElement = document.createElement('div');
                    reservationDivElement.classList.add('reservation-item');
                    var extensionStatus = '';
                    if (reservationData.extension === 0) {
                        extensionStatus = 'NONE';
                    } else if (reservationData.extension === 1) {
                        extensionStatus = reservationData.extension + " HOUR";
                    } else {
                        extensionStatus = reservationData.extension + " HOURS";
                    }

                    reservationDivElement.innerHTML = `
                        <p><strong>Reservation ID:</strong><br>${reservationId}</p>
                        <p><strong>Reservation Date:</strong><br>${reservationData.reservationCheckInDate}</p>
                        <p><strong>Check-In Time:</strong><br>${reservationData.reservationCheckInTime}</p>
                        <p><strong>Room Type:</strong><br>${reservationData.roomType}</p>
                        <p><strong>Duration:</strong><br>${reservationData.duration} HOURS</p>
                        <p><strong>Number of Guests:</strong><br>${reservationData.numberOfGuests}</p>
                        <p><strong>Extension:</strong><br>${extensionStatus}</p>
                        <p><strong>Amount to Pay:</strong><br>PHP ${reservationData.amountToPay}.00</p><hr>
                        <p><strong>Full Name:</strong><br>${reservationData.lastName}, ${reservationData.firstName}</p>
                        <p><strong>Phone Number:</strong><br>${reservationData.phoneNumber}</p>
                        <p><strong>Email Address:</strong><br>${reservationData.emailAddress}</p>
                        <div class="reservation-buttons">
                            <button class="btn-book"><i class="fa-solid fa-check"></i></button>
                            <button class="btn-no-show"><i class="fa-solid fa-user-slash"></i></button>
                            <button class="btn-invalid"><i class="fa-solid fa-text-slash"></i></button>
                        </div>
                    `;

                    reservationDiv.appendChild(reservationDivElement);
                    // Attach event listeners after the content is rendered

                    if (currentFile === 'employee.html') {
                        // If it's the employee page, hide the btn-invalid button
                        const invalidButtons = document.querySelectorAll('.btn-invalid');
                        invalidButtons.forEach(button => button.style.display = 'none');
                    }

                    reservationDivElement.querySelector('.btn-book').addEventListener('click', function () {
                        const today = new Date();
                        const checkInDate = new Date(reservationData.reservationCheckInDate);
                        const checkInTime = reservationData.reservationCheckInTime;
                        const amountToPay = reservationData.amountToPay;

                        // Parsing the check-in time considering AM/PM
                        const [time, modifier] = checkInTime.split(' ');
                        let [checkInHour, checkInMinute] = time.split(':').map(Number);

                        if (modifier === 'PM' && checkInHour < 12) {
                            checkInHour += 12;
                        } else if (modifier === 'AM' && checkInHour === 12) {
                            checkInHour = 0;
                        }

                        // Combine the check-in date and time into a single Date object
                        const checkInDateTime = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), checkInHour, checkInMinute);

                        // Calculate the differences
                        const timeDifference = checkInDateTime - today;
                        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                        const minutesDifference = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60));

                        if (daysDifference > 0) {
                            alert(`Reservation check-in date for ID: ${reservationId} is not yet today. \nIt will be ${daysDifference} day/s to go.`);
                        } else if (daysDifference === 0 && minutesDifference > 10) {
                            alert(`Reservation for ID: ${reservationId} is not yet in this time. \n${minutesDifference} minutes to go.`);
                        } else if (daysDifference === 0 && minutesDifference <= 10) {
                            const roomElement = reservationDivElement.querySelector('p:nth-child(4)');

                            if (roomElement) {
                                const roomText = roomElement.textContent.trim();

                                // Extract the room type by splitting based on the colon and trimming
                                const roomTypeMatch = roomText.match(/Room Type:\s*(.*)/);
                                const roomType = roomTypeMatch ? roomTypeMatch[1].trim() : 'Unknown';

                                // Ask if the customer has paid the amount
                                const isPaid = confirm(`Has the customer paid the amount PHP ${amountToPay}.00, for Reservation ID: ${reservationId}?\nThis action can not be undone!`);

                                if (isPaid) {
                                    showRoomSelectionModal(roomType, reservationData, reservationId);
                                } else {
                                    alert('Please ensure the customer has paid before proceeding with the reservation.');
                                }
                            } else {
                                console.error('Room type element not found!');
                            }
                        } else if (daysDifference === 0 || minutesDifference < 0 && minutesDifference >= -10) {

                            const continueBooking = confirm(`The reservation for ID: ${reservationId} check-in time has passed less than 10 minutes.\nDo the customer what to continue the booking? `);

                            if (continueBooking) {
                                const roomElement = reservationDivElement.querySelector('p:nth-child(4)');

                                if (roomElement) {
                                    const roomText = roomElement.textContent.trim();

                                    // Extract the room type by splitting based on the colon and trimming
                                    const roomTypeMatch = roomText.match(/Room Type:\s*(.*)/);
                                    const roomType = roomTypeMatch ? roomTypeMatch[1].trim() : 'Unknown';

                                    // Ask if the customer has paid the amount
                                    const isPaid = confirm(`Has the customer paid the amount PHP ${amountToPay}.00, for Reservation ID: ${reservationId}?\nThis action can not be undone!`);

                                    if (isPaid) {
                                        showRoomSelectionModal(roomType, reservationData, reservationId);
                                    } else {
                                        alert('Please ensure the customer has paid before proceeding with the reservation.');
                                    }
                                }
                            } else {
                                const failedBooking = confirm(`The reservation for ID: ${reservationId} will be invalid if continue.`);
                                if (failedBooking) {
                                    const reservationCheckInDate = reservationData.reservationCheckInDate;
                                    const reason = 'Customer showed passed the check-out time and decide to discontinue booking.';
                                    moveToFailedReservations(reservationId, reservationCheckInDate, reason);
                                }
                            }
                        }
                        else {
                            alert(`The reservation for ID: ${reservationId} check-in time has passed 10 minutes.\nReservation now invalid and unable to continue.`);
                        }
                    });

                    reservationDivElement.querySelector('.btn-no-show').addEventListener('click', function () {
                        const today = new Date();
                        const checkInDate = new Date(reservationData.reservationCheckInDate);
                        const checkInTime = reservationData.reservationCheckInTime;
                        const reservationCheckInDate = reservationData.reservationCheckInDate;

                        // Parsing the check-in time considering AM/PM
                        const [time, modifier] = checkInTime.split(' ');
                        let [checkInHour, checkInMinute] = time.split(':').map(Number);

                        if (modifier === 'PM' && checkInHour < 12) {
                            checkInHour += 12;
                        } else if (modifier === 'AM' && checkInHour === 12) {
                            checkInHour = 0;
                        }

                        // Combine the check-in date and time into a single Date object
                        const checkInDateTime = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), checkInHour, checkInMinute);

                        // Calculate the differences
                        const timeDifference = checkInDateTime - today;
                        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                        const minutesDifference = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60));

                        if (daysDifference > 0) {
                            alert(`Reservation check-in date for ID: ${reservationId} is not yet today. \nIt will be ${daysDifference} day/s to go.`);
                        } else if (daysDifference === 0 && minutesDifference > 10) {
                            alert(`Reservation for ID: ${reservationId} is not yet in this time. \n${minutesDifference} minutes to go.`);
                        } else {
                            const confirmNoShow = confirm(`Has the customer for Reservation ID: ${reservationId} no showed his/her reservation? \nThis action can not be undone!`);
                            if (confirmNoShow) {
                                const reason = 'No show / Did not appear';
                                moveToFailedReservations(reservationId, reservationCheckInDate, reason);
                            }
                        }
                    });

                    reservationDivElement.querySelector('.btn-invalid').addEventListener('click', function () {
                        openInvalidModal(reservationId, reservationData);
                    });

                }
            }
        } else {
            hideLoadingScreen();
        }
    } catch (error) {
        console.error('Error fetching reservations:', error);
    }
}

async function setupRoomSelectionModal(roomType) {
    const roomSelectionModal = document.getElementById('roomSelectionModal');
    const roomNumbersContainer = document.getElementById('roomNumbersContainer');
    const roomNumbers = roomNumbersContainer.querySelectorAll('.room-number');

    // Reset styles for all room numbers
    roomNumbers.forEach(roomDiv => {
        roomDiv.classList.remove('disabled');
        roomDiv.style.backgroundColor = ''; // Reset to default
        roomDiv.style.cursor = ''; // Reset cursor
    });

    // Define which rooms should be disabled based on room type
    const airconRooms = [1, 3, 5, 7];
    const standardRooms = [2, 4, 6, 8, 9, 10];

    for (const roomDiv of roomNumbers) {
        const roomNumber = parseInt(roomDiv.getAttribute('data-room'), 10);

        // Fetch room availability from Firebase (this is an async operation)
        const roomState = await getRoomState(roomNumber);

        if ((roomType === 'STANDARD ROOM' && standardRooms.includes(roomNumber)) ||
            (roomType === 'AIR-CONDITIONED ROOM' && airconRooms.includes(roomNumber))) {
            roomDiv.classList.add('disabled');
            roomDiv.style.backgroundColor = 'Gray'; // Set background color to gray
            roomDiv.style.cursor = 'not-allowed'; // Set cursor to not-allowed
        } else if (roomState && !roomState.isRoomAvailable) {
            roomDiv.style.backgroundColor = 'red';
            roomDiv.style.cursor = 'not-allowed';
            roomDiv.classList.add('disabled');
        } else if (roomState && roomState.isRoomAvailable) {
            roomDiv.style.backgroundColor = 'green';
        }
    }

    // After all room availability checks are done, show the modal
    roomSelectionModal.style.display = 'block';
}

async function showRoomSelectionModal(roomType, reservationData, reservationId) {
    // Show loading screen
    showLoadingScreen();

    try {
        await setupRoomSelectionModal(roomType);

        const roomNumbersContainer = document.getElementById('roomNumbersContainer');
        const roomNumbers = roomNumbersContainer.querySelectorAll('.room-number');

        roomNumbers.forEach(roomDiv => {
            if (roomDiv.style.backgroundColor === 'green') {
                // Add a click event listener for the green rooms
                roomDiv.addEventListener('click', async () => {
                    await handleRoomSelection(roomDiv, reservationData, reservationId);
                });
            }
        });

    } catch (error) {
        console.error('Error fetching room states:', error);
    } finally {
        // Hide the loading screen
        hideLoadingScreen();
    }
}

async function handleRoomSelection(roomDiv, reservationData, reservationId) {
    const roomNumber = roomDiv.getAttribute('data-room');
    const roomSelectionModal = document.getElementById('roomSelectionModal');

    if (reservationData && reservationId) {
        const { duration, extension, reservationCheckInDate } = reservationData;

        // Calculate check-out time
        const now = new Date();
        const checkOut = new Date(now.getTime() + (duration + extension) * 60 * 60 * 1000);
        const checkOutDate = checkOut.toLocaleDateString();
        const checkOutTime = checkOut.toLocaleTimeString();

        const totalDuration = duration + extension;

        // Save check-in/check-out data and get the checkInId
        const checkInId = await saveCheckInData(
            roomNumber,
            duration,
            reservationCheckInDate,
            now.toLocaleTimeString(), // checkInTime
            checkOutDate,
            checkOutTime,
            extension,
            totalDuration,
            reservationData.numberOfGuests,
            reservationData.amountToPay
        );

        // Move the reservation data to 'completedReservations', including the checkInId
        await moveToCompletedReservations(reservationId, reservationCheckInDate, checkInId);

        // Update room availability
        await saveRoomState(roomNumber, false);

        // Update UI
        roomDiv.style.backgroundColor = 'red';
        roomDiv.style.cursor = 'not-allowed';
        roomDiv.classList.add('disabled');

        location.reload(true);

        // Hide the modal
        roomSelectionModal.style.display = 'none';
    } else {
        console.error('Reservation data or ID is missing.');
    }
}

function convertDateToISOFormat(dateString) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function moveToCompletedReservations(reservationId, reservationCheckInDate, checkInId) {
    try {
        const isoFormattedDate = convertDateToISOFormat(reservationCheckInDate);
        const reservationRef = ref(db, `activeReservations/${isoFormattedDate}/${reservationId}`);
        const completedReservationRef = ref(db, `completedReservations/${isoFormattedDate}/${reservationId}`);

        const reservationSnapshot = await get(reservationRef);

        if (reservationSnapshot.exists()) {
            const reservationDetails = reservationSnapshot.val();
            reservationDetails.checkInId = checkInId; // Add the checkInId to the reservation details

            await set(completedReservationRef, reservationDetails);
            await remove(reservationRef);

            location.reload(true);
        } else {
            console.error('Reservation data does not exist for ID:', reservationId);
            // Additional debugging info
            console.log('Path checked:', reservationRef.toString());
        }
    } catch (error) {
        console.error('Error moving data to completedReservations:', error);
    }
}

async function moveToFailedReservations(reservationId, reservationDate, reason) {
    try {
        const isoFormattedDate = convertDateToISOFormat(reservationDate);
        const reservationRef = ref(db, `activeReservations/${isoFormattedDate}/${reservationId}`);
        const failedReservationRef = ref(db, `failedReservations/${isoFormattedDate}/${reservationId}`);

        const reservationSnapshot = await get(reservationRef);

        if (reservationSnapshot.exists()) {
            const reservationDetails = reservationSnapshot.val();
            reservationDetails.reasonForFailure = reason; // Add the reason to the reservation details

            await set(failedReservationRef, reservationDetails);
            await remove(reservationRef);

            location.reload(true);
        } else {
            console.error('Reservation data does not exist for ID:', reservationId);
            console.log('Path checked:', reservationRef.toString());
        }
    } catch (error) {
        console.error('Error moving data to failedReservations:', error);
    }
}

// Get modal elements
const invalidModal = document.querySelector('.invalidReservation'); // Target the correct modal
const closeInvalidModal = document.getElementById('closeInvalidModal');
const moveToFailedBtn = document.getElementById('moveToFailed');
const editReservationBtn = document.getElementById('editReservation');
const invalidReservationMessage = document.getElementById('invalidReservationMessage');
const editReservationKey = document.getElementById('editReservationKey');
const editReservationValue = document.querySelector('.editReservationValue');

// Variables to store the current reservation data
let currentReservationId = '';
let currentReservationData = {};

// Open invalid reservation modal
function openInvalidModal(reservationId, reservationData) {
    currentReservationId = reservationId;
    currentReservationData = reservationData;
    var extensionStatus;

    if (reservationData.extension === 0) {
        extensionStatus = 'NONE';
    } else if (reservationData.extension === 1) {
        extensionStatus = reservationData.extension + " HOUR";
    } else {
        extensionStatus = reservationData.extension + " HOURS";
    }

    // Populate the reservation info in the modal
    document.getElementById('reservationInfoId').textContent = reservationId;
    document.getElementById('reservationInfoCheckInDate').textContent = reservationData.reservationCheckInDate;
    document.getElementById('reservationInfoCheckInTime').textContent = reservationData.reservationCheckInTime;
    document.getElementById('reservationInfoRoomType').textContent = reservationData.roomType;
    document.getElementById('reservationInfoDuration').textContent = reservationData.duration + ' HOURS';
    document.getElementById('reservationInfoExtension').textContent = extensionStatus;
    document.getElementById('reservationInfoNumOfGuest').textContent = reservationData.numberOfGuests;
    document.getElementById('reservationInfoTotalAmountPaid').textContent = `PHP ${reservationData.amountToPay}.00`;

    invalidReservationMessage.textContent = `Would you like to delete Reservation ID: ${reservationId} due to invalid values, or would you prefer to edit the values?`;

    const editReservationValueInput = document.querySelector('#editReservationValue');
    editReservationValueInput.value = reservationData.lastName;

    // Show the invalid reservation modal
    invalidModal.style.display = 'flex'; // Show the modal
}

// Handle move to failed reservations
moveToFailedBtn.onclick = async function () {
    const reason = document.querySelector('.reasonOfFailure').value.trim();

    if (reason === '') {
        alert('Please provide a reason for the failure.');
        return;
    }

    await moveToFailedReservations(currentReservationId, currentReservationData.reservationCheckInDate, reason);
    invalidModal.style.display = 'none';
};

// Handle editing reservation values
editReservationKey.addEventListener('change', function () {
    const selectedKey = editReservationKey.value;
    editReservationValue.value = currentReservationData[selectedKey] || '';
});

editReservationBtn.onclick = async function () {
    const selectedKey = editReservationKey.value;
    const newValue = editReservationValue.value.trim();

    if (newValue === '') {
        alert('Please provide a new value.');
        return;
    }

    // Convert the reservationCheckInDate from MM/DD/YYYY to YYYY-MM-DD
    const checkInDate = currentReservationData.reservationCheckInDate;
    const [month, day, year] = checkInDate.split('/');
    const formattedCheckInDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Update the specific reservation field
    try {
        const reservationRef = ref(db, `activeReservations/${formattedCheckInDate}/${currentReservationId}`);
        await update(reservationRef, { [selectedKey]: newValue });

        alert(`Reservation updated successfully!`);
        invalidModal.style.display = 'none';
        location.reload(true); 
    } catch (error) {
        console.error('Error updating reservation:', error);
        alert('Failed to update the reservation. Please try again.');
    }
};
// Close the modal when the user clicks on the close button
closeInvalidModal.onclick = function () {
    invalidModal.style.display = 'none';
};

document.getElementById('closeRoomSelectionModal').addEventListener('click', function () {
    document.getElementById('roomSelectionModal').style.display = 'none';
});