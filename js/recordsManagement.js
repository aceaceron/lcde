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


// Add event listeners to <li> elements
document.querySelectorAll('.tableNames ul li').forEach(li => {
    li.addEventListener('click', function () {
        const tableId = this.id; // Get the ID of the clicked <li>
        const tableDatasDiv = document.querySelector('.tableDatas');

        tableDatasDiv.style.display = "flex";
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
document.querySelector('#workAccounts').addEventListener('click', function () {
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

            // Display sub-IDs as clickable elements with delete buttons
            subIds.forEach(subId => {
                const listItem = document.createElement('li');
                listItem.classList.add('sub-id-item');

                // Create sub-ID text element
                const subIdText = document.createElement('span');
                subIdText.textContent = subId;
                subIdText.dataset.subId = subId; // Store subId in a data attribute
                subIdText.style.cursor = 'pointer';
                subIdText.addEventListener('click', function () {
                    fetchAndDisplayData(tableId, this.dataset.subId);
                });

                // Create delete button
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
                deleteButton.classList.add('delete-button');
                deleteButton.addEventListener('click', function (event) {
                    event.stopPropagation(); // Prevent triggering the click event on the list item
                    if (confirm(`Are you sure you want to delete all data for sub-ID: ${subId}?`)) {
                        deleteDataForSubId(tableId, subId);
                    }
                });

                // Append sub-ID text and delete button to list item
                listItem.appendChild(subIdText);
                listItem.appendChild(deleteButton);
                subIdList.appendChild(listItem);
            });
        } else {
            tableDatasDiv.textContent = 'No sub-IDs available for this section.';
        }
    }).catch((error) => {
        console.error("Error fetching sub-IDs: ", error);
    });
}

// Function to delete all data for a specific sub-ID
function deleteDataForSubId(tableId, subId) {
    const subIdRef = ref(db, `${tableId}/${subId}`);

    // Set the data at the specified sub-ID reference to null to delete it
    set(subIdRef, null).then(() => {
        alert(`Data for sub-ID: ${subId} has been deleted successfully.`);
        // Refresh the sub-ID list after deletion
        fetchSubIdsAndDisplayData(tableId);
    }).catch((error) => {
        console.error("Error deleting data: ", error);
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

            // Initialize variables for the summary
            let totalAmountPaid = 0;
            let totalGuests = 0;
            let numOfRows = 0;

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


            const tbody = document.createElement('tbody');

            Object.entries(data).forEach(([id, record]) => {
                const row = document.createElement('tr');
                numOfRows++;

                const idCell = document.createElement('td');
                idCell.textContent = id;
                row.appendChild(idCell);

                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = record[header];
                    row.appendChild(td);

                    // Calculate totals
                    if (header === 'totalAmountPaid' && tableId === 'pastCheckIn') {
                        totalAmountPaid += parseFloat(record[header]) || 0;
                    }
                    if (header === 'numberOfGuests' && tableId === 'pastCheckIn') {
                        totalGuests += parseInt(record[header]) || 0;
                    }
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            // Create and display the summary above the table
            if (tableId === 'pastCheckIn') {
                const summaryHeader = document.createElement('h3');
                summaryHeader.textContent = `Past Check Ins Summary For ${subId}`;
                summaryHeader.classList.add('summary-header');

                const summaryDetails = document.createElement('p');
                summaryDetails.innerHTML = `
                    Number of Check Out Sessions: ${numOfRows}<br>
                    Number of Combined Guests: ${totalGuests}<br>
                    Overall Amount Paid: PHP ${totalAmountPaid.toFixed(2)}
                `;
                summaryDetails.classList.add('summary-details');

                tableDatasDiv.appendChild(summaryHeader);
                tableDatasDiv.appendChild(summaryDetails);
            }

            // Append the table to the .tableDatas div
            tableDatasDiv.appendChild(table);
        } else {
            tableDatasDiv.textContent = 'No data available for this sub-ID.';
        }
    }).catch((error) => {
        console.error("Error fetching data: ", error);
    });
}

document.querySelector('#clearData').addEventListener('click', async function () {
    document.querySelector('.tableDatas').textContent = '';
    if (window.innerWidth < 1000) {
        document.querySelector('.tableDatas').style.display = 'none';
    }
});