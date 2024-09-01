// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, onValue, get, remove, update, onChildChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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


// Function to format the current date as YYYYMMDD
function formatDate() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last two digits of the year
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month (01-12)
    const date = String(now.getDate()).padStart(2, '0'); // Date (01-31)
    return `${year}${month}${date}`;
}

// Function to get the next sequential number for the date key
async function getNextSequentialNumber(dateKey) {
    const countRef = ref(db, `_countForCheckIns/${dateKey}`);

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

// Function to generate a unique ID based on the current date and a sequential number
async function generateCheckInId() {
    const dateKey = formatDate();
    const sequentialNumber = await getNextSequentialNumber(dateKey);
    // Format sequential number with leading zeros
    const formattedNumber = String(sequentialNumber).padStart(3, '0');
    return `${dateKey}-${formattedNumber}`;
}

// Function to save check-in/check-out data to Firebase
export async function saveCheckInData(roomNum, initialDuration, checkInDate, checkInTime, checkOutDate, checkOutTime, extension, totalDuration, numberOfGuests, totalAmountPaid, shouldMoveToPast = false) {
    try {
        const checkInId = await generateCheckInId(); // Assuming this generates a unique ID
        const newCheckInCheckOutRef = ref(db, `currentCheckIn/${checkInId}`);

        const checkInCheckOutData = {
            roomNum,
            initialDuration,
            checkInDate,
            checkInTime,
            checkOutDate,
            checkOutTime,
            extension,
            totalDuration,
            numberOfGuests,
            totalAmountPaid
        };

        await set(newCheckInCheckOutRef, checkInCheckOutData);

        if (shouldMoveToPast) {
            await moveDataToPastCheckIn(checkInId);
        }

        return checkInId; // Return the generated check-in ID
    } catch (error) {
        console.error('Error in saveCheckInData function:', {
            message: error.message,
            stack: error.stack,
            data: {
                roomNum,
                initialDuration,
                checkInDate,
                checkInTime,
                checkOutDate,
                checkOutTime,
                extension,
                totalDuration,
                numberOfGuests,
                totalAmountPaid
            }
        });
        throw error;
    }
}

window.fetchRoomData = async function(roomNum) {
    try {
        const roomRef = ref(db, 'currentCheckIn'); 
        const snapshot = await get(roomRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            let foundEntry = null;
            let checkInId = null;

            for (let key in data) {
                if (data.hasOwnProperty(key) && data[key].roomNum === roomNum) {
                    foundEntry = data[key];
                    checkInId = key;  // Save the key as the unique ID
                    break;
                }
            }
            if (foundEntry) {
                const { initialDuration, checkInDate, checkInTime, checkOutDate, checkOutTime, extension, numberOfGuests, totalDuration, totalAmountPaid } = foundEntry;
                var extensionStatus = '';
                if (extension === 0) {
                    extensionStatus = 'NONE';
                } else if (extension === 1) {
                    extensionStatus = extension + " HOUR";
                }else {
                    extensionStatus = extension + " HOURS";
                }

                const roomType = ['2', '4', '6', '8', '9', '10'].includes(roomNum) ? 'Air-conditioned Room' : 'Standard Room';
                document.getElementById('roomInfoUnavail').textContent = 'ROOM ' + roomNum;
                document.getElementById('UnavailRoomType').textContent = roomType;
                document.getElementById('UnavailRoomNum').textContent = roomNum;
                document.getElementById('UnavailDuration').textContent = initialDuration + ' HOURS';
                document.getElementById('UnavailCheckInDate').textContent = checkInDate;
                document.getElementById('UnavailCheckInTime').textContent = checkInTime;
                document.getElementById('UnavailCheckOutDate').textContent = checkOutDate;
                document.getElementById('UnavailCheckOutTime').textContent = checkOutTime;
                document.getElementById('UnavailExtension').textContent = extensionStatus;
                document.getElementById('UnavailTotalDuration').textContent = totalDuration + ' HOURS';
                document.getElementById('UnavailNumOfGuest').textContent = numberOfGuests;
                document.getElementById('UnavailTotalAmountPaid').textContent = 'PHP ' + totalAmountPaid + '.00';

                document.getElementById('UnavailCheckInId').textContent = checkInId;

                const currentTime = new Date().getTime();
                const checkoutDateTime = new Date(`${checkOutDate} ${checkOutTime}`).getTime();
                let remainingTime = checkoutDateTime - currentTime;

                // Find the button for the selected room
                const roomButton = document.querySelector(`#room${roomNum}`);
                if (roomButton) {
                    // Pass checkInId and roomNum to startCountdown
                    startCountdown(remainingTime, roomButton, checkInId, roomNum);
                }
            } else {
                console.log('No data available for the selected room.');
            }
        }
    } catch (error) {
        console.error('Error fetching room details:', error);
    }
}

let countdown;

function startCountdown(initialDuration, roomButton, checkInId, roomId) {
    const availabilityText = roomButton.querySelector('.availability-text');

    countdown = setInterval(() => {  // Assign the interval ID to the higher-scoped variable
        let hours = Math.floor((initialDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((initialDuration % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((initialDuration % (1000 * 60)) / 1000);

        availabilityText.textContent = `${hours}h ${minutes}m ${seconds}s`;

        if (initialDuration <= 0) {
            clearInterval(countdown);
            roomButton.style.backgroundColor = 'skyblue';
            roomButton.style.color = 'black';
            roomButton.querySelector('.availability-text').textContent = "Available";
            saveRoomState(roomId, true); // 'true' indicates the room is now available
            
            moveDataToPastCheckIn(checkInId);
        } else {
            initialDuration -= 1000;
        }
    }, 1000);
}

async function moveDataToPastCheckIn(checkInId) {
    try {
        // Reference to the current check-in/check-out data using the unique ID
        const checkInCheckOutRef = ref(db, `currentCheckIn/${checkInId}`);
        
        // Get the data
        const checkInCheckOutSnapshot = await get(checkInCheckOutRef);
        const checkInCheckOutData = checkInCheckOutSnapshot.val();

        if (checkInCheckOutData) {
            // Get the current date and time
            const now = new Date();
            
            // Format the check-out time as HH:MM:SS AM/PM
            const hours = now.getHours() % 12 || 12; // Convert 0 to 12 for AM/PM
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
            const formattedTime = `${hours}:${minutes}:${seconds} ${ampm}`;
            
            // Format the check-out date as MM/DD/YYYY or M/DD/YYYY
            const month = now.getMonth() + 1; // getMonth() is zero-based
            const day = now.getDate();
            const year = now.getFullYear();
            const formattedDate = `${month}/${day}/${year}`;
            
            // Overwrite the checkOutTime and checkOutDate
            checkInCheckOutData.checkOutTime = formattedTime;
            checkInCheckOutData.checkOutDate = formattedDate;

            const checkOutDateDirectory = convertDateToISOFormat(formattedDate);
            console.log(checkOutDateDirectory);

            // Save the data to the pastCheckIn table under the current date using the unique ID
            const pastCheckInRef = ref(db, `pastCheckIn/${checkOutDateDirectory}/${checkInId}`);
            
            // Save the data to the pastCheckIn table
            await set(pastCheckInRef, checkInCheckOutData);
            
            // Remove the old data from currentCheckIn
            await remove(checkInCheckOutRef);
        }
    } catch (error) {
        console.error('Error moving data to pastCheckIn:', error);
    }
}


// Constants for additional fees
const ADDITIONAL_EXTENSIONFEE_NON_AIRCON = 100;
const ADDITIONAL_EXTENSIONFEE_AIRCON = 150;

document.getElementById('extendHr').addEventListener('click', async function() {
    try {
        // Show confirmation dialog to the user
        const confirmed = confirm('Are you sure you that the guest paid to extend the check-out time by one hour?');

        if (!confirmed) {
            console.log('Extension canceled.');
            return; // Exit if the user cancels
        }

        const checkInIdElement = document.getElementById('UnavailCheckInId');
        const roomNumElement = document.getElementById('UnavailRoomNum');

        // Check if required DOM elements are present
        if (!checkInIdElement || !roomNumElement) {
            console.error('Required DOM elements not found.');
            return;
        }

        // Retrieve unique ID and selected room number
        const checkInId = checkInIdElement.textContent.trim();
        const roomNum = roomNumElement.textContent.trim();

        if (!checkInId || !roomNum) {
            console.error('Unique ID or Room Number is missing.');
            return;
        }

        // Determine the additional fee based on the room type
        const additionalFee = ['2', '4', '6', '8', '9', '10'].includes(roomNum) ? ADDITIONAL_EXTENSIONFEE_AIRCON : ADDITIONAL_EXTENSIONFEE_NON_AIRCON;

        // Reference to the current booking data in Firebase
        const bookingRef = ref(db, `currentCheckIn/${checkInId}`);
        const snapshot = await get(bookingRef);

        if (!snapshot.exists()) {
            console.error('No data available for the given unique ID.');
            return;
        }

        const bookingData = snapshot.val();


        // Extract and format the check-out date and time
        const checkOutDateStr = bookingData.checkOutDate; // Format should be MM/DD/YYYY
        const checkOutTimeStr = bookingData.checkOutTime; // Format should be HH:MM:SS AM/PM

        // Create a Date object with the correct format
        const [month, day, year] = checkOutDateStr.split('/'); // MM/DD/YYYY
        const [time, modifier] = checkOutTimeStr.split(' '); // HH:MM:SS AM/PM
        const [hours, minutes, seconds] = time.split(':'); // HH:MM:SS

        // Convert to 24-hour format if necessary
        let hours24 = parseInt(hours, 10);
        if (modifier === 'PM' && hours24 < 12) hours24 += 12;
        if (modifier === 'AM' && hours24 === 12) hours24 = 0;

        // Construct the ISO 8601 date-time string
        const isoDateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours24.toString().padStart(2, '0')}:${minutes}:${seconds}`;
        
        // Log the formatted ISO date-time string for debugging
        console.log('Combining check-out date and time:', isoDateTimeStr);

        const checkOutDateTime = new Date(isoDateTimeStr);

        // Check if the Date object is valid
        if (isNaN(checkOutDateTime.getTime())) {
            console.error('Invalid check-out datetime format:', isoDateTimeStr);
            return;
        }

        // Add one hour to the check-out time
        checkOutDateTime.setHours(checkOutDateTime.getHours() + 1);
        
        // Convert the updated Date object to ISO string and local date/time strings
        const newCheckoutTimeISO = checkOutDateTime.toISOString();
        const newCheckoutDate = checkOutDateTime.toLocaleDateString();
        const newCheckoutTime = checkOutDateTime.toLocaleTimeString();

        const newExtension = (bookingData.extension || 0) + 1;
        const newTotalDuration = (bookingData.totalDuration || 0) + 1;

        // Update the total amount paid
        const originalAmount = parseFloat(document.getElementById('UnavailTotalAmountPaid').textContent.split('PHP ')[1]);
        const newTotalAmount = originalAmount + additionalFee;

        document.getElementById('UnavailTotalAmountPaid').textContent = `PHP ${newTotalAmount.toFixed(2)}`;

        // Update Firebase with the new checkout time and total amount
        await set(bookingRef, {
            ...bookingData,
            checkOutDate: newCheckoutDate,
            checkOutTime: newCheckoutTime,
            extension: newExtension,
            totalDuration: newTotalDuration, 
            totalAmountPaid: newTotalAmount
        });

        // Update the UI with the new check-out date and time
        document.getElementById('UnavailCheckOutDate').textContent = newCheckoutDate;
        document.getElementById('UnavailCheckOutTime').textContent = newCheckoutTime;
        document.getElementById('UnavailExtension').textContent = `${newExtension} HOURS`;
        document.getElementById('UnavailTotalDuration').textContent = `${newTotalDuration} HOURS`;

        location.reload(true);

    } catch (error) {
        console.error('Error extending booking:', error);
    }
});

document.getElementById('timeOut').addEventListener('click', async function() {
    // Confirm action with the user
    const confirmed = confirm('Are you sure you want to mark this room as checked out? This action cannot be undone.');

    if (confirmed) {
        // Proceed if user pressed OK
        const checkInId = document.getElementById('UnavailCheckInId').textContent; // Fetch the displayed unique ID
        
        // Reset the room's UI
        const roomButton = document.querySelector(`.room[data-room="${roomNum}"]`);
        if (roomButton) {
            roomButton.style.backgroundColor = 'skyblue';
            roomButton.style.color = 'black';
            roomButton.querySelector('.availability-text').textContent = "Available";
        }
        
        try {
            // Update the room's availability and "wasRecentlyAvailable" status in Firebase
            await saveRoomState(roomNum, true);

            // Move the data to the "pastCheckIn" table
            await moveDataToPastCheckIn(checkInId);

            // Hide the sliding panel
            document.getElementById('slidingPanelUnavail').classList.remove('show');
            
            // Clear the countdown interval
            clearInterval(countdown);

            location.reload();
        } catch (error) {
            console.error('Error during time-out process:', error);
        }
    } else {
        console.log('Time-out action canceled by user.');
    }
});

// Function to save room state (availability) to Firebase
export async function saveRoomState(roomNum, isRoomAvailable) {
    try {
        const roomRef = ref(db, `rooms/${roomNum}`);
        const updates = {
            isRoomAvailable: isRoomAvailable,
        };

        if (isRoomAvailable) {
            updates.wasRecentlyAvailable = true; // Mark as recently available
        } else {
            updates.wasRecentlyAvailable = false; // Reset when room is unavailable
        }

        await update(roomRef, updates);
        console.log(`Room ${roomNum} availability updated to ${isRoomAvailable}`);
    } catch (error) {
        console.error('Error saving room state:', error);
    }
}

// Function to retrieve room state from Firebase
async function getRoomState(roomId) {
    try {
        const roomRef = ref(db, `rooms/${roomId}`);
        const snapshot = await get(roomRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return { isRoomAvailable: true }; // Default to available if no data
        }
    } catch (error) {
        console.error('Error retrieving room state:', error);
        return { isRoomAvailable: true }; // Default to available in case of error
    }
}

// Function to initialize room with Firebase data
export async function initializeRoom(roomElement, roomId) {
    const roomState = await getRoomState(roomId);
    if (roomState && !roomState.isRoomAvailable) {
        roomElement.style.backgroundColor = 'red';
        roomElement.style.color = 'white';
        changeAvailability(roomElement);
    }

    roomElement.addEventListener('click', async function() {
        if (window.yesBtnPressed) {
            // Save the room state to Firebase
            await saveRoomState(roomId, false);

            // Update the UI
            roomElement.style.backgroundColor = 'red';
            roomElement.style.color = 'white';
            changeAvailability(roomElement);
        }
    });
}

// Function to fetch and display reservations
async function displayReservations() {
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

                    reservationDivElement.querySelector('.btn-book').addEventListener('click', function() {
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
                        
                        console.log(minutesDifference);
                    
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

                    reservationDivElement.querySelector('.btn-no-show').addEventListener('click', function() {
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

                    reservationDivElement.querySelector('.btn-invalid').addEventListener('click', function() {
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
            
            console.log('Reservation moved to failedReservations successfully.');
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
moveToFailedBtn.onclick = async function() {
    const reason = document.querySelector('.reasonOfFailure').value.trim();
    
    if (reason === '') {
        alert('Please provide a reason for the failure.');
        return;
    }

    await moveToFailedReservations(currentReservationId, currentReservationData.reservationCheckInDate, reason);
    invalidModal.style.display = 'none';
};

// Handle editing reservation values
editReservationKey.addEventListener('change', function() {
    const selectedKey = editReservationKey.value;
    editReservationValue.value = currentReservationData[selectedKey] || '';
});

editReservationBtn.onclick = async function() {
    const selectedKey = editReservationKey.value;
    const newValue = editReservationValue.value.trim();

    if (newValue === '') {
        alert('Please provide a new value.');
        return;
    }

    // Update the specific reservation field
    // Convert the reservationCheckInDate from MM/DD/YYYY to YYYY-MM-DD
    const checkInDate = currentReservationData.reservationCheckInDate;
    const [month, day, year] = checkInDate.split('/');
    const formattedCheckInDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    console.log('Updating reservation with path:', `activeReservations/${formattedCheckInDate}/${currentReservationId}`);
    console.log('Selected Key:', selectedKey);
    console.log('New Value:', newValue);
    console.log(formattedCheckInDate);

    try {
        const reservationRef = ref(db, `activeReservations/${formattedCheckInDate}/${currentReservationId}`);
        await update(reservationRef, { [selectedKey]: newValue });

        alert(`Reservation updated successfully!`);
        invalidModal.style.display = 'none';
        location.reload(true); // Reload the page to reflect changes
    } catch (error) {
        console.error('Error updating reservation:', error);
        alert('Failed to update the reservation. Please try again.');
    }
};
// Close the modal when the user clicks on the close button
closeInvalidModal.onclick = function() {
    invalidModal.style.display = 'none';
};

document.getElementById('closeRoomSelectionModal').addEventListener('click', function() {
    document.getElementById('roomSelectionModal').style.display = 'none';
});

// Function to show the loading screen
function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

// Function to hide the loading screen
function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    hideLoadingScreen();
});

// Function to listen for WebSocket errors
window.addEventListener('error', function(event) {
    // Check if the error is related to WebSocket or Firebase and if it includes "ERR_NETWORK_CHANGED"
    if (event.message && event.message.includes('ERR_NETWORK_CHANGED')) {
        alert('No internet connection. Please check your network and try again.');
    }
});

// Alternatively, listen specifically for unhandled rejections (often includes network errors)
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('ERR_NETWORK_CHANGED')) {
        alert('No internet connection. Please check your network and try again.');
    }
});

// Add event listeners to <li> elements
document.querySelectorAll('.tableNames ul li').forEach(li => {
    li.addEventListener('click', function() {
        const tableId = this.id; // Get the ID of the clicked <li>
        const tableDatasDiv = document.querySelector('.tableDatas');
        
        // Clear previous data
        tableDatasDiv.innerHTML = '';
        
        // Check if the clicked <li> is 'currentCheckIn'
        if (tableId === 'currentCheckIn') {
            // Specific logic for 'currentCheckIn'
            fetchCurrentCheckInData();
        }
        else {
            // General logic for other <li> elements
            fetchSubIdsAndDisplayData(tableId);
        }
    });
});
// Add event listener to #workAccounts element
document.querySelector('#workAccounts').addEventListener('click', function() {
    fetchWorkAccountsData();
});

// Function to fetch and display 'workAccounts' data
function fetchWorkAccountsData() {
    const tableDatasDiv = document.querySelector('.tableDatas');
    
    // Clear previous data
    tableDatasDiv.innerHTML = '';
    
    // Replace 'workAccounts' with the appropriate path in your database
    const dataRef = ref(db, 'workAccounts');
    get(dataRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const table = document.createElement('table');
            table.classList.add('data-table');

            // Create table headers based on the first record
            const headers = Object.keys(data[Object.keys(data)[0]]);
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            // Create table headers without ID
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create table body with fetched data
            const tbody = document.createElement('tbody');
            Object.values(data).forEach(record => {
                const row = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = record[header]; // Access specific properties
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            // Append the table to the .tableDatas div
            tableDatasDiv.appendChild(table);
        } else {
            tableDatasDiv.textContent = 'No data available for this section.';
        }
    }).catch((error) => {
        console.error("Error fetching data: ", error);
    });
}

// Function to fetch and display 'currentCheckIn' data
function fetchCurrentCheckInData() {
    const tableDatasDiv = document.querySelector('.tableDatas');
    
    // Replace 'currentCheckIn' with the appropriate path in your database
    const dataRef = ref(db, 'currentCheckIn');
    get(dataRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const table = document.createElement('table');
            table.classList.add('data-table');

            // Create table headers based on the first record
            const headers = Object.keys(data[Object.keys(data)[0]]);
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            // Add 'ID' column header
            const idHeader = document.createElement('th');
            idHeader.textContent = 'ID';
            headerRow.appendChild(idHeader);
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create table body with fetched data
            const tbody = document.createElement('tbody');
            Object.entries(data).forEach(([id, record]) => {
                const row = document.createElement('tr');
                // Add ID cell
                const idCell = document.createElement('td');
                idCell.textContent = id;
                row.appendChild(idCell);
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = record[header]; // Make sure to access specific properties
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            // Append the table to the .tableDatas div
            tableDatasDiv.appendChild(table);
        } else {
            tableDatasDiv.textContent = 'No data available for this section.';
        }
    }).catch((error) => {
        console.error("Error fetching data: ", error);
    });
}

// Function to fetch sub-IDs and display data
function fetchSubIdsAndDisplayData(tableId) {
    const tableDatasDiv = document.querySelector('.tableDatas');
    const subIdListContainer = document.createElement('div');
    subIdListContainer.classList.add('sub-id-list-container');

    // Clear previous data
    tableDatasDiv.innerHTML = '';
    
    // Create and append the message
    const message = document.createElement('p');
    message.textContent = 'Please select a date to view the data';
    message.classList.add('info-message');
    subIdListContainer.appendChild(message);

    // Create and append the sub-IDs list container
    const subIdList = document.createElement('ul');
    subIdList.classList.add('sub-id-list');
    subIdListContainer.appendChild(subIdList);

    tableDatasDiv.appendChild(subIdListContainer);

    // Reference to fetch all sub-IDs
    const tableIdRef = ref(db, tableId);

    get(tableIdRef).then((snapshot) => {
        if (snapshot.exists()) {
            const subData = snapshot.val();
            const subIds = Object.keys(subData);

            // Clear subIdList to remove any previous items
            subIdList.innerHTML = '';
            
            // Display sub-IDs as clickable elements
            subIds.forEach(subId => {
                const listItem = document.createElement('li');
                listItem.textContent = subId;
                listItem.classList.add('sub-id-item');
                listItem.dataset.subId = subId; // Store subId in a data attribute
                listItem.addEventListener('click', function() {
                    fetchAndDisplayData(tableId, this.dataset.subId);
                });
                subIdList.appendChild(listItem);
            });
        } else {
            tableDatasDiv.textContent = 'No sub-IDs available for this section.';
        }
    }).catch((error) => {
        console.error("Error fetching sub-IDs: ", error);
    });
}

// Function to fetch and display data for the selected sub-ID
function fetchAndDisplayData(tableId, subId) {
    const fullPath = `${tableId}/${subId}`;
    const dataRef = ref(db, fullPath);

    get(dataRef).then((snapshot) => {
        const tableDatasDiv = document.querySelector('.tableDatas');
        tableDatasDiv.innerHTML = ''; // Clear previous data

        if (snapshot.exists()) {
            const data = snapshot.val();
            const table = document.createElement('table');
            table.classList.add('data-table');

            // Create table headers based on the first record
            const headers = Object.keys(data[Object.keys(data)[0]]);
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            // Add 'ID' column header
            const idHeader = document.createElement('th');
            idHeader.textContent = 'ID';
            headerRow.appendChild(idHeader);
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create table body with fetched data
            const tbody = document.createElement('tbody');
            Object.entries(data).forEach(([id, record]) => {
                const row = document.createElement('tr');
                // Add ID cell
                const idCell = document.createElement('td');
                idCell.textContent = id;
                row.appendChild(idCell);
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = record[header]; // Make sure to access specific properties
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            // Append the table to the .tableDatas div
            tableDatasDiv.appendChild(table);
        } else {
            tableDatasDiv.textContent = 'No data available for this sub-ID.';
        }
    }).catch((error) => {
        console.error("Error fetching data: ", error);
    });
}

document.querySelector('#clearData').addEventListener('click', async function() {
    document.querySelector('.tableDatas').textContent = '';
});

document.addEventListener('DOMContentLoaded', function() {
    displayReservations();
    displayComments();
    
    // Get elements
    const dashboardSection = document.querySelector('.dashboard');
    const accountsSection = document.querySelector('.accounts');
    const recordsSection = document.querySelector('.records');
    const manualBookingSection = document.querySelector('.manualBooking');
    const commentsSection = document.querySelector('.comments');
    const inventorySection = document.querySelector('.inventory');

    // Initially show the dashboard and hide records
    dashboardSection.style.display = 'flex';
    accountsSection.style.display = 'none';
    recordsSection.style.display = 'none';
    manualBookingSection.style.display = 'none';
    commentsSection.style.display = 'none';
    inventorySection.style.display = 'none';


    // Add click event listeners
    document.querySelector('#dashboard').addEventListener('click', function() {
        dashboardSection.style.display = 'flex';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });

    document.querySelector('#accounts').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'flex';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });

    document.querySelector('#records').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'flex';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#commentsList').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'flex';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#mnlBooking').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'flex';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#inventory').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'flex';
    });
    document.querySelector('#dashboardBtn').addEventListener('click', function() {
        dashboardSection.style.display = 'flex';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });

    document.querySelector('#accountsBtn').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'flex';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });

    document.querySelector('#recordsBtn').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'flex';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#mnlBookingBtn').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'flex';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#commentsListBtn').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'flex';
        inventorySection.style.display = 'none';
    });
    document.querySelector('#inventoryBtn').addEventListener('click', function() {
        dashboardSection.style.display = 'none';
        accountsSection.style.display = 'none';
        recordsSection.style.display = 'none';
        manualBookingSection.style.display = 'none';
        commentsSection.style.display = 'none';
        inventorySection.style.display = 'flex';
    });
});

// Function to display comments
function displayComments() {
    const commentsRef = ref(db, 'comments');
    const commentsContainer = document.querySelector('.comments-container');

    // Clear existing comments
    commentsContainer.innerHTML = '';

    // Add a heading for comments
    const heading = document.createElement('h1');
    heading.textContent = 'Comments';
    commentsContainer.appendChild(heading);

    // Fetch comments from Firebase Realtime Database
    onValue(commentsRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const commentData = childSnapshot.val();
            const fileURL = commentData.fileURL || ''; // Default to empty string if fileURL is missing
            const name = commentData.name || 'Anonymous'; // Default to 'Anonymous' if name is missing
            const email = commentData.email || 'N/A'; // Default to 'N/A' if email is missing
            const dateAndTimeOfVisit = new Date(commentData.dateAndTimeOfVisit).toLocaleString();
            const comment = commentData.comment || 'No comment'; // Default to 'No comment' if comment is missing

            // Create comment card element
            const commentCard = document.createElement('div');
            commentCard.className = 'comment-card';

            // Create comment info container
            const commentInfo = document.createElement('div');
            commentInfo.className = 'comment-info';

            // Add comment details
            const nameElem = document.createElement('div');
            nameElem.className = 'name';
            nameElem.textContent = `Name: ${name}`;

            const emailElem = document.createElement('div');
            emailElem.className = 'email';
            emailElem.textContent = `Email: ${email}`;

            const dateTimeElem = document.createElement('div');
            dateTimeElem.className = 'date-time';
            dateTimeElem.textContent = `Date & Time: ${dateAndTimeOfVisit}`;

            const commentText = document.createElement('div');
            commentText.className = 'comment';
            commentText.textContent = `Comment: ${comment}`;

            // Add photo link if available
            if (fileURL) {
                const photoLink = document.createElement('a');
                photoLink.href = fileURL;
                photoLink.target = '_blank'; // Open in a new tab
                photoLink.textContent = 'View Photo';
                commentInfo.appendChild(photoLink);
            }

            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'comments-delete-button';
            deleteButton.textContent = 'Delete';

            deleteButton.addEventListener('click', () => {
                const confirmDelete = confirm('Are you sure you want to delete this comment?');
                if (confirmDelete) {
                    remove(childSnapshot.ref) // Remove the specific comment
                        .then(() => {
                            alert('Comment deleted successfully.');
                        })
                        .catch((error) => {
                            alert('Failed to delete comment: ' + error.message);
                        });
                }
            });

            // Append elements to the comment card
            commentInfo.appendChild(nameElem);
            commentInfo.appendChild(emailElem);
            commentInfo.appendChild(dateTimeElem);
            commentInfo.appendChild(commentText);

            commentCard.appendChild(commentInfo);
            commentCard.appendChild(deleteButton);

            // Append comment card to the comments container
            commentsContainer.appendChild(commentCard);
        });
    });
}

document.querySelector('#saveManualBooking').addEventListener('click', async function() {
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

document.addEventListener('DOMContentLoaded', function () {
    // Function to fetch and update inventory data with filtering
    async function updateInventoryData(selectedRoom, filter) {
        if (selectedRoom) {
            try {
                const roomRef = ref(db, `rooms/${selectedRoom}`);
                const roomSnapshot = await get(roomRef);
                const roomData = roomSnapshot.val();
    
                if (roomData) {
                    let tableHTML = '<table class="data-table">';
                    tableHTML += '<thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';
    
                    const roomTableKeySelect = document.getElementById('roomTableKey');
                    roomTableKeySelect.innerHTML = ''; // Clear previous options
    
                    for (const key in roomData) {
                        const value = roomData[key];
    
                        // Apply the filter
                        if (filter === 'quantity' && !key.toLowerCase().includes('quantity')) continue;
                        if (filter === 'status' && !key.toLowerCase().includes('status')) continue;
                        if (filter === 'present' && !key.toLowerCase().includes('present')) continue;
                        if (filter === 'boolean' && typeof value !== 'boolean') continue;
                        if (filter === 'forRepair' && (!key.toLowerCase().includes('status') || value === 'All Working')) continue;
    
                        // Display value with or without icon
                        let displayValue = document.createElement('span');
                        displayValue.textContent = value;
    
                        if (key.toLowerCase().includes('status') && value !== 'All Working') {
                            const icon = document.createElement('i');
                            icon.className = ' fa-solid fa-triangle-exclamation';
                            displayValue.appendChild(icon);
                        }
    
                        tableHTML += `<tr><td>${key}</td><td>${displayValue.outerHTML}</td></tr>`;
    
                        const option = document.createElement('option');
                        option.value = key;
                        option.textContent = key;
                        option.dataset.value = value !== undefined ? value : null;
                        roomTableKeySelect.appendChild(option);
                    }
    
                    tableHTML += '</tbody></table>';
                    document.querySelector('.inventory-data').innerHTML = tableHTML;
    
                    const updateInput = document.querySelector('.inventory-update input[type="text"]');
                    const statusDropdown = document.getElementById('valueForStatusKeyType');
    
                    const firstOption = roomTableKeySelect.options[0];

                    if (firstOption) {
                        // Automatically toggle input fields based on the filter
                        if (filter === 'status' || filter === 'forRepair') {
                            updateInput.style.display = 'none';
                            statusDropdown.style.display = 'inline';
                            statusDropdown.value = firstOption.dataset.value !== undefined ? firstOption.dataset.value : null;
                        } else {
                            updateInput.style.display = 'inline';
                            statusDropdown.style.display = 'none';
                        }

                        const selectedValue = firstOption.dataset.value;
                        updateInput.placeholder = selectedValue || "Select a value";
                        updateInput.value = ''; // Clear the input field after update
                    } else {
                        // Handle the case where there are no options available
                        updateInput.style.display = 'inline';
                        statusDropdown.style.display = 'none';
                        updateInput.placeholder = "No options available";
                        updateInput.value = ''; // Clear the input field after update
                    }
                }
            } catch (error) {
                console.error('Error fetching room data:', error);
            }
        }
    }
    
    // Initial room selection event listener
    document.getElementById('roomSelected').addEventListener('change', function () {
        const selectedRoom = this.value;
        const tableFilter = document.getElementById('tableFilter');

        if (selectedRoom === 'all') {
            displayCombinedRoomData();
            tableFilter.disabled = true;
        } else if (selectedRoom) {
            const filter = document.getElementById('tableFilter').value;
            updateInventoryData(selectedRoom, filter);
            tableFilter.disabled = false;
        }
    });

    async function displayCombinedRoomData() {
        try {
            const roomNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'eventHall'];
            let combinedData = {};
    
            const fetchPromises = roomNumbers.map(async (roomNumber) => {
                const roomRef = ref(db, `rooms/${roomNumber === 'eventHall' ? 'eventHall' : roomNumber}`);
                const roomSnapshot = await get(roomRef);
                return roomSnapshot.val();
            });
    
            const allRoomsData = await Promise.all(fetchPromises);
    
            allRoomsData.forEach(roomData => {
                if (roomData) {
                    Object.keys(roomData).forEach(key => {
                        if (key.toLowerCase().includes('quantity') && typeof roomData[key] === 'number') {
                            if (!combinedData[key]) {
                                combinedData[key] = 0;
                            }
                            combinedData[key] += roomData[key];
                        }
                    });
                }
            });
    
            displayData(combinedData);
        } catch (error) {
            console.error('Error fetching and combining room data:', error);
            alert('An error occurred while fetching and combining data.');
        }
    }
    
    function displayData(data) {
        const outputElement = document.querySelector('.inventory-data'); // Target the .inventory-data container
        outputElement.innerHTML = ''; // Clear any previous content
        
        let tableHTML = '<table class="data-table">';
        tableHTML += '<thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';
        
        for (const [key, value] of Object.entries(data)) {
            tableHTML += `<tr><td>${key}</td><td>${value}</td></tr>`;
        }
        
        tableHTML += '</tbody></table>';
        outputElement.innerHTML = tableHTML; // Insert the generated HTML into the container
    }
    
    // Filter event listener
    document.getElementById('tableFilter').addEventListener('change', function () {
        const selectedRoom = document.getElementById('roomSelected').value;
        const filter = this.value;
        updateInventoryData(selectedRoom, filter);

    });

    document.getElementById('updateButton').addEventListener('click', async function () {
        const selectedRoom = document.getElementById('roomSelected').value;
        const selectedKey = document.getElementById('roomTableKey').value;
        const filter = document.getElementById('tableFilter').value;
    
        let newValueRaw;
    
        // Check if the selected key contains "status"
        if (selectedKey.toLowerCase().includes('status')) {
            // Use the value from the status dropdown
            newValueRaw = document.getElementById('valueForStatusKeyType').value;
        } else {
            // Use the value from the input field
            newValueRaw = document.querySelector('.inventory-update input[type="text"]').value;
        }
    
        if (selectedRoom && selectedKey && newValueRaw) {
            try {
                const keyRef = ref(db, `rooms/${selectedRoom}/${selectedKey}`);
                const keySnapshot = await get(keyRef);
                const currentValue = keySnapshot.val();
    
                // Determine the type of the existing value
                const currentType = typeof currentValue;
    
                // Convert the new value to match the current type
                let newValue;
                switch (currentType) {
                    case 'number':
                        newValue = parseFloat(newValueRaw);
                        if (isNaN(newValue)) {
                            alert('Please enter a valid number.');
                            clearInputFields();
                            return;
                        }
                        break;
                    case 'boolean':
                        if (newValueRaw.toLowerCase() === 'true' || newValueRaw.toLowerCase() === 'false') {
                            newValue = newValueRaw.toLowerCase() === 'true';
                        } else {
                            alert('Please enter a valid value (True or False only).');
                            clearInputFields();
                            return;
                        }
                        break;

                            // Validate HH:MM AM/PM format
                            const timePattern = /^(0[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i;
                            if (timePattern.test(newValueRaw)) {
                                newValue = newValueRaw.replace(/^0+/, '');
                            } else {
                                alert('Please enter a valid time in the format HH:MM AM/PM.');
                                clearInputFields();
                                return;
                            }
                            break;
                    case 'string':
                        if (selectedKey.toLowerCase().includes('date')) {
                            // Validate MM/DD/YYYY format for date
                            const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
                            if (datePattern.test(newValueRaw)) {
                                // Remove leading zeros from month and day
                                newValue = newValueRaw.replace(/(^|\/)0+/g, '$1');
                            } else {
                                alert('Please enter a valid date in the format MM/DD/YYYY.');
                                clearInputFields();
                                return;
                            }
                        } else if (selectedKey.toLowerCase().includes('time')) {
                            // Validate HH:MM AM/PM format for time
                            const timePattern = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i;
                            if (timePattern.test(newValueRaw)) {
                                // Parse the input time
                                let [time, period] = newValueRaw.split(/\s+/);
                                let [hour, minute] = time.split(':');
                                
                                // Combine with seconds and period
                                newValue = `${hour}:${minute}:00 ${period.toUpperCase()}`;
                                newValue = newValue.replace(/^0/, '');
                            } else {
                                alert('Please enter a valid time in the format HH:MM:SS AM/PM.');
                                clearInputFields();
                                return;
                            }
                        } else {
                            newValue = newValueRaw;
                        }
                        break;
                    default:
                        console.error('Unsupported data type:', currentType);
                        clearInputFields();
                        return;
                }
                const userConfirmed = confirm(`Are you sure you want to update the value for ${selectedKey}?`);
                if (userConfirmed) {
                    await set(keyRef, newValue);
                    alert('Value updated successfully');
                    updateInventoryData(selectedRoom, filter);
                    updateRoomSelectionOptions();
                    clearInputFields();
                }

            } catch (error) {
                console.error('Error updating key:', error);
            }
        } else {
            alert('Please select a room, a key, and provide a value.');
        }
    });
    
    // Utility function to clear input fields
    function clearInputFields() {
        document.querySelector('.inventory-update input[type="text"]').value = '';
        document.getElementById('valueForStatusKeyType').value = 'All Working';
    }

    // Handle the change event on the roomTableKey select element
    document.getElementById('roomTableKey').addEventListener('change', function () {
        const selectedKey = this.value;
        const selectedValue = this.options[this.selectedIndex].dataset.value;
    
        if (selectedKey.toLowerCase().includes('status')) {
            document.querySelector('.inventory-update input[type="text"]').style.display = 'none';
            document.getElementById('valueForStatusKeyType').style.display = 'inline';
        } else {
            document.querySelector('.inventory-update input[type="text"]').style.display = 'inline';
            document.getElementById('valueForStatusKeyType').style.display = 'none';
            const updateInput = document.querySelector('.inventory-update input[type="text"]');
            updateInput.placeholder = selectedValue;
            updateInput.value = "";
        }
    });

    document.getElementById('addButton').addEventListener('click', async function () {
        const valueDataTypeSelect = document.getElementById('valueDataType');
        const selectedRoom = document.getElementById('roomSelected').value;
        const addKey = document.getElementById('inventory-addKey').value;
        const addValueRaw = document.getElementById('inventory-addValue').value;
        const statusDropdown = document.getElementById('valueForStatusKeyTypeForAdd');
        const filter = document.getElementById('tableFilter').value;
        const selectedType = valueDataTypeSelect.value;
        
        if ((selectedRoom && addKey && addValueRaw) || selectedType) {
            try {
                const roomRef = ref(db, `rooms/${selectedRoom}/${addKey}`);
                const keySnapshot = await get(roomRef);
                const existingValue = keySnapshot.val();
                let addValue;
    
                if (existingValue !== null) {
                    alert("Key exists in the database! Update if you want to change the value.");
                    document.getElementById('inventory-addKey').value = '';
                    document.getElementById('inventory-addValue').value = '';
                    return;
                } else {
                    switch (selectedType) {
                        case 'Number':
                            addValue = parseFloat(addValueRaw);
                            if (isNaN(addValue)) {
                                alert('Please enter a valid number.');
                                document.getElementById('inventory-addValue').value = '';
                                return;
                            }
                            break;
                        case 'equipmentStatus': // Matching the correct value
                            addValue = statusDropdown.value; // Use the selected value from the dropdown
                            break;
                        case 'Boolean':
                            if (addValueRaw.toLowerCase() === 'true' || addValueRaw.toLowerCase() === 'false') {
                                addValue = addValueRaw.toLowerCase() === 'true';
                            } else {
                                alert('Please enter a valid value (True or False only).');
                                document.getElementById('inventory-addValue').value = '';
                                return;
                            }
                            break;
                        case 'Date':
                            // Validate MM/DD/YYYY format
                            const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
                            if (datePattern.test(addValueRaw)) {
                                // Remove leading zeros from month and day
                                addValue = addValueRaw.replace(/(^|\/)0+/g, '$1');
                            } else {
                                alert('Please enter a valid date in the format MM/DD/YYYY.');
                                document.getElementById('inventory-addValue').value = '';
                                return;
                            }
                            break;
                        case 'Time':
                            // Validate HH:MM AM/PM or HH:MM:SS AM/PM format
                            const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?\s?(AM|PM)$/i;
                            if (timePattern.test(addValueRaw)) {
                                let [time, period] = addValueRaw.split(/\s+/);
                                let [hours, minutes, seconds] = time.split(':');
                        
                                // Ensure seconds are present
                                if (seconds === undefined) {
                                    seconds = '00';
                                }
                        
                                // Convert period to uppercase
                                period = period.toUpperCase();
                        
                                // Format time with seconds
                                addValue = `${hours}:${minutes}:${seconds} ${period}`;
                                addValue = addValue.replace(/^0/, '');
                            } else {
                                alert('Please enter a valid time in the format HH:MM:SS AM/PM.');
                                document.getElementById('inventory-addValue').value = '';
                                return;
                            }
                            break;
                                
                        case 'String':
                        default:
                            addValue = addValueRaw;
                            break;
                    }
                }
                const userConfirmed = confirm(`Are you sure you want to add Key: ${addKey}, Value: ${addValue}?`);
                if (userConfirmed) {
                    await set(roomRef, addValue);
                    updateInventoryData(selectedRoom, filter);
                    alert('Key and value added successfully');
                    document.getElementById('inventory-addKey').value = '';
                    document.getElementById('inventory-addValue').value = '';
                    updateRoomSelectionOptions();
                }
            } catch (error) {
                console.error('Error adding key:', error);
            }
        } else {
            alert('Please provide a room, key, and value.');
        }
    });

    document.getElementById('deleteButton').addEventListener('click', async function () {
        const selectedRoom = document.getElementById('roomSelected').value;
        const selectedKey = document.getElementById('roomTableKey').value;
        const filter = document.getElementById('tableFilter').value;

        if (selectedRoom && selectedKey) {
            try {
                const keyRef = ref(db, `rooms/${selectedRoom}/${selectedKey}`);
                const userConfirmed = confirm(`Are you sure you want to delete Key: ${selectedKey}?`);
                if (userConfirmed) {
                    await remove(keyRef);
                    console.log('Key removed successfully');
                    updateInventoryData(selectedRoom, filter); 
                    // Clear the input field after update
                    document.querySelector('.inventory-update input[type="text"]').value = '';
                    updateRoomSelectionOptions();
                }
            } catch (error) {
                console.error('Error removing key:', error);
            }
        } else {
            console.log('Please select a room and a key.');
        }
    });

    // Update placeholder based on selected data type
    document.getElementById('valueDataType').addEventListener('change', function () {
        const valueInput = document.getElementById('inventory-addValue');
        valueInput.value = "";
        const selectedType = document.getElementById('valueDataType').value;
        if (selectedType === 'Date') {
            valueInput.placeholder = 'MM/DD/YYYY';
        } else if (selectedType === 'Time') {
            valueInput.placeholder = 'HH:MM:SS AM/PM';
        } else if (selectedType === 'Boolean') {
            valueInput.placeholder = 'True/False only';
        } else {
            valueInput.placeholder = 'Value';
        }

        const valueDataType = this.value; // Get the selected value of the dropdown
        const equipmentStatusValue = 'equipmentStatus'; // String to compare with
    
        if (valueDataType === equipmentStatusValue) {
            document.getElementById('valueForStatusKeyTypeForAdd').style.display = 'inline';
            document.getElementById('inventory-addValue').style.display = 'none';
        } else {
            document.getElementById('valueForStatusKeyTypeForAdd').style.display = 'none';
            document.getElementById('inventory-addValue').style.display = 'inline';
        }
    });

    async function updateRoomSelectionOptions() {
        try {
            const roomNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'eventHall'];
            const roomSelected = document.getElementById('roomSelected');
            
            for (const roomNumber of roomNumbers) {
                const roomRef = ref(db, `rooms/${roomNumber === 'eventHall' ? 'eventHall' : roomNumber}`);
                const roomSnapshot = await get(roomRef);
                const roomData = roomSnapshot.val();

                if (roomData) {
                    let roomStatusAlert = false;
                    for (const key in roomData) {
                        if (key.toLowerCase().includes('status') && roomData[key] !== 'All Working') {
                            roomStatusAlert = true;
                            break;
                        }
                    }

                    // Update the option text with the warning icon if needed
                    const option = roomSelected.querySelector(`option[value="${roomNumber}"]`);
                    
                    if (option) {
                        if (roomNumber === `eventHall` && roomStatusAlert) {
                            option.textContent = `Event Hall ⚠️`;
                        } else if (roomNumber === `eventHall` && !roomStatusAlert) {
                            option.textContent = `Event Hall`;
                        } else if (roomStatusAlert) {
                            option.textContent = `Room ${roomNumber} ⚠️`;
                        } else {
                            option.textContent = `Room ${roomNumber}`;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error updating room selection options:', error);
        }
    }

    // Call the function to update room selection options
    updateRoomSelectionOptions();
    
});
const recentRooms = new Set(); // To keep track of rooms that have just become available

// Listen for changes in the isRoomAvailable field for all rooms
const roomsRef = ref(db, 'rooms');
onChildChanged(roomsRef, (snapshot) => {
    const roomId = snapshot.key;
    const roomData = snapshot.val();

    if (roomData.isRoomAvailable === true) {
        recentRooms.add(roomId); // Add to the recent rooms set
    }
});

window.addEventListener('DOMContentLoaded', async function () {
    try {
        const roomsRef = ref(db, 'rooms/');
        const snapshot = await get(roomsRef);

        if (snapshot.exists()) {
            const rooms = snapshot.val();
            let hasToDo = false;

            for (const roomId in rooms) {
                const roomData = rooms[roomId];

                // Check if the room was recently made available
                if (roomData.isRoomAvailable && roomData.wasRecentlyAvailable) {
                    hasToDo = true;
                    break;
                }
            }

            if (hasToDo) {
                document.querySelector('.fa-list-check').classList.add('has-todo');
            }
        }
    } catch (error) {
        console.error('Error checking rooms on page load:', error);
    }
});

document.querySelector('.fa-list-check').addEventListener('click', async function () {
    const toDoListContainer = document.querySelector('.to-do-list-container');
    const roomListElement = document.createElement('ul'); // Create a list element
    const faListCheckIcon = document.querySelector('.fa-list-check');
    let hasRoomsToCheck = false; // Track if there are rooms to check

    try {
        const roomsRef = ref(db, 'rooms/');
        const snapshot = await get(roomsRef);

        // Clear the previous list content
        toDoListContainer.innerHTML = '<span><h3>Rooms to check</h3><button class="close-btn" id="closeBtnToDoList">&times;</button></span>';

        if (snapshot.exists()) {
            const rooms = snapshot.val();
            let roomCount = 0;

            for (const roomId in rooms) {
                const roomData = rooms[roomId];

                // Check if the room was recently made available
                if (roomData.isRoomAvailable && roomData.wasRecentlyAvailable) {
                    const listItem = document.createElement('li');
                    const checkButton = document.createElement('button');
                    checkButton.classList.add('check-btn');
                    checkButton.setAttribute('data-room-id', roomId);
                    listItem.innerHTML = `
                        Room ${roomId} 
                        <button class="check-btn" data-room-id="${roomId}">Check</button>
                    `;
                    roomListElement.appendChild(listItem); // Add the room to the list
                    hasRoomsToCheck = true;
                    roomCount++;
                }
            }

            // Add the list to the container
            toDoListContainer.appendChild(roomListElement);
            // Display the red circle indicator if there are rooms to check
            if (roomCount > 0) {
                faListCheckIcon.classList.add('has-todo'); // Add class for the red circle
            } else {
                faListCheckIcon.classList.remove('has-todo'); // Remove class if no rooms
            }
        }

        // If no rooms have changed availability, show the message
        if (!hasRoomsToCheck) {
            toDoListContainer.innerHTML += '<p>No rooms have recently changed their availability.</p>';
            faListCheckIcon.classList.remove('has-todo'); // Remove class if no data
        }
    } catch (error) {
        console.error('Error fetching rooms:', error);
    }

    // Show the to-do list container
    document.querySelector('.to-do-list').style.display = 'flex';

    // Close button functionality
    document.getElementById('closeBtnToDoList').addEventListener('click', function () {
        document.querySelector('.to-do-list').style.display = 'none';
    });
});

document.querySelector('.to-do-list-container').addEventListener('click', async function (event) {
    if (event.target.classList.contains('check-btn')) {
        const roomNumber = event.target.getAttribute('data-room-id');
        // Fetch and update room data when a room is checked
        await updateRoomData(roomNumber);

        // Show the roomChecking container
        document.querySelector('.roomChecking').style.display = 'flex';
    }
});

async function updateRoomData(roomNumber) {
    if (roomNumber) {
        try {
            const roomRef = ref(db, `rooms/${roomNumber}`);
            const roomSnapshot = await get(roomRef);
            const roomData = roomSnapshot.val();

            if (roomData) {
                let currentPage = 0;
                const pages = {
                    quantity: [],
                    status: [],
                    present: [],
                    summary: []
                };

                // Segregate keys into pages
                for (const key in roomData) {
                    const value = roomData[key];

                    if (key.toLowerCase().includes('quantity')) {
                        pages.quantity.push({ key, value });
                    } else if (key.toLowerCase().includes('status')) {
                        pages.status.push({ key, value });
                    } else if (key.toLowerCase().includes('present')) {
                        pages.present.push({ key, value });
                    }
                }

                function renderPage() {
                    let formHTML = '<div class="roomChecking-header">';
                    formHTML += `<h3>Room ${roomNumber}</h3>`;
                    formHTML += `<div class="close-btn" id="closeBtnRoomChecking">&times;</div>`;
                    const currentSection = currentPage === 0 ? "Equipment Quantity" 
                                    : currentPage === 1 ? "Equipment Status" 
                                    : currentPage === 2 ? "Equipment Presence" 
                                    : "Summary of Changes";
                    formHTML += `</div>`;
                    formHTML += `<p>Room Checking - ${currentSection}</p>`;
    
                    if (currentPage === 3) {
                        // Summary page
                        formHTML += '<div class="form-summary"><h4>Summary of Changes</h4><ul>';
                        if (pages.summary && pages.summary.length > 0) {
                            pages.summary.forEach(({ key, oldValue, newValue }) => {
                                formHTML += `<li><strong>${key}:</strong> ${oldValue} → ${newValue}</li>`;
                            });
                        } else {
                            formHTML += '<li>No changes made.</li>';
                        }
                        formHTML += '</ul></div>';
                        formHTML += '<div class="form-buttons">';
                        formHTML += '<button type="button" id="previousPage">Previous</button>';
                        formHTML += '<button type="button" id="submitUpdatedValue">Confirm</button>';
                        formHTML += '</div>';
                    } else {
                        // Regular page
                        formHTML += '<form id="roomDataForm" class="room-data-form">';
                        const currentKeySet = Object.keys(pages)[currentPage];
                        pages[currentKeySet].forEach(({ key, value }) => {
                            formHTML += `<div class="form-group"><label for="${key}">${key}</label>`;
                
                            if (typeof value === 'boolean') {
                                formHTML += `<input type="checkbox" id="${key}" name="${key}" ${value ? 'checked' : ''} />`;
                            } else if (typeof value === 'number') {
                                formHTML += `<input type="number" id="${key}" name="${key}" value="${value}" />`;
                            } else if (typeof value === 'string' && key.toLowerCase().includes('status')) {
                                formHTML += `<select id="${key}" name="${key}">
                                    <option value="All Working" ${value === 'All Working' ? 'selected' : ''}>All Working</option>
                                    <option value="Some are working, some are broken" ${value === 'Some are working, some are broken' ? 'selected' : ''}>Some are working, some are broken</option>
                                    <option value="Need cleaning" ${value === 'Need cleaning' ? 'selected' : ''}>Need cleaning</option>
                                    <option value="Not Working" ${value === 'Not Working' ? 'selected' : ''}>Not Working</option>
                                </select>`;
                            } else {
                                formHTML += `<input type="text" id="${key}" name="${key}" value="${value}" />`;
                            }
                            formHTML += '</div>';
                        });
                        formHTML += '</form>';
                        formHTML += '<div class="form-buttons">';
                        formHTML += '<button type="button" id="nextPage">Next</button>';
                        if (currentPage > 0) {
                            formHTML += '<button type="button" id="previousPage">Previous</button>';
                        }
                        formHTML += '</div>';
                    }
                
                    console.log('Rendered Form HTML:', formHTML); // Debugging statement
                    document.querySelector('.roomChecking-container').innerHTML = formHTML;
                
                    // Handle navigation
                    document.getElementById('nextPage')?.addEventListener('click', function () {
                        saveCurrentPageValues();
                        currentPage++;
                        renderPage();
                    });
                
                    document.getElementById('previousPage')?.addEventListener('click', function () {
                        currentPage--;
                        renderPage();
                    });
                
                    // Handle form submission on the summary page
                    if (currentPage === 3) {
                        document.getElementById('submitUpdatedValue')?.addEventListener('click', async function () {
                            // Collect updated data and update Firebase
                            saveCurrentPageValues();
                            try {
                                const updates = {};
                                pages.summary.forEach(({ key, newValue }) => {
                                    updates[key] = newValue;
                                });
                
                                // Set wasRecentlyAvailable to false
                                updates.wasRecentlyAvailable = false;
                
                                await update(roomRef, updates);
                                alert('Room data updated successfully!');
                                document.querySelector('.roomChecking').style.display = 'none';
                                document.querySelector('.to-do-list').style.display = 'none';
                                location.reload();
                            } catch (error) {
                                console.error('Error updating room data:', error);
                            }
                        });
                    }
                
                    // Handle close button
                    document.getElementById('closeBtnRoomChecking').addEventListener('click', function () {
                        document.querySelector('.roomChecking').style.display = 'none';
                    });
                }
                
                // Save the values from the current page before moving to the next one
                function saveCurrentPageValues() {
                    const currentKeySet = Object.keys(pages)[currentPage];
                    pages[currentKeySet].forEach(({ key, value }) => {
                        const element = document.getElementById(key);
                
                        if (!element) {
                            console.warn(`Element with id ${key} not found.`);
                            return;
                        }
                
                        let newValue;
                        if (element.type === 'checkbox') {
                            newValue = element.checked;
                        } else if (element.type === 'number') {
                            newValue = parseFloat(element.value);
                        } else if (element.type === 'select-one') {
                            newValue = element.value;
                        } else {
                            newValue = element.value;
                        }
                
                        // Find the corresponding item in the pages array
                        const pageItem = pages[currentKeySet].find(item => item.key === key);
                        if (pageItem) {
                            const { value: oldValue } = pageItem;
                            if (oldValue !== undefined && oldValue !== newValue) {
                                // Add to summary if the value has changed
                                if (!pages.summary) pages.summary = [];
                                pages.summary.push({
                                    key,
                                    oldValue,
                                    newValue
                                });
                            }
                            pageItem.value = newValue; // Update the current value
                        }
                    });
                
                    // Debugging
                    console.log('Updated Pages Summary:', pages.summary);
                }
                
                
                // Render the first page initially
                renderPage();
            } else {
                document.querySelector('.roomChecking').innerHTML = '<p>No data available for this room.</p>';
            }
        } catch (error) {
            console.error('Error fetching room data:', error);
        }
    } else {
        console.error('Invalid room number:', roomNumber);
    }
}

console.log('Firebase script loaded and ready');
