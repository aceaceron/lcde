import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Your web app's Firebase configuration
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
const auth = getAuth();
const database = getDatabase();

document.getElementById('createAccount').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission

    const workAccountLastName = document.getElementById('workAccountLastName').value;
    const workAccountFirstName = document.getElementById('workAccountFirstName').value;
    const workAccountAddressPurok = document.getElementById('workAccountAddressPurok').value;
    const workAccountAddressBrgy = document.getElementById('workAccountAddressBrgy').value;
    const workAccountAddressMunicipality = document.getElementById('workAccountAddressMunicipality').value;
    const workAccountAddressProvince = document.getElementById('workAccountAddressProvince').value;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const accountType = document.getElementById('accountType').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            const sanitizedEmail = email.replace('.', ','); // Replace '.' with ',' in email to use as key

            // Save the account type in the database
            set(ref(database, 'workAccounts/' + sanitizedEmail), {
                lastName : workAccountLastName,
                firstName : workAccountFirstName,
                addressPurok : workAccountAddressPurok,
                addressBrgy : workAccountAddressBrgy,
                addressMunicipality : workAccountAddressMunicipality,
                addressProvince : workAccountAddressProvince,
                email: email,
                password: password,
                accountType: accountType
            });

            alert(`${accountType} account created!`);


            document.getElementById('workAccountLastName').value = '';
            document.getElementById('workAccountFirstName').value = '';
            document.getElementById('workAccountAddressPurok').value = '';
            document.getElementById('workAccountAddressBrgy').value = '';
            document.getElementById('workAccountAddressMunicipality').value = '';
            document.getElementById('workAccountAddressProvince').value = '';

            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('accountType').value = 'Employee';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage);
        });
});

function displayAccounts() {
    const database = getDatabase();
    const auth = getAuth(); 
    const accountsRef = ref(database, 'workAccounts');

    // Fetch accounts data
    onValue(accountsRef, (snapshot) => {
        const accountsContainer = document.querySelector('.displayAccounts');
        accountsContainer.innerHTML = ''; // Clear any existing content

        const textElement = document.createElement('h1');
        textElement.textContent =  `Active Work Accounts`;
        accountsContainer.appendChild(textElement);

        snapshot.forEach((childSnapshot) => {
            const emailKey = childSnapshot.key.replace(',', '.'); // Convert the sanitized email back to normal
            const accountData = childSnapshot.val();
            const accountType = accountData.accountType;
            const password = accountData.password; // Fetch the user's password from the Realtime Database

            // Create elements for displaying the account info in a grid item
            const accountCard = document.createElement('div');
            const accountInfo = document.createElement('div');
            const emailElement = document.createElement('span');
            const accountTypeElement = document.createElement('span');
            const deleteButton = document.createElement('button');

            // Set class names for styling
            accountCard.className = 'account-card';
            accountInfo.className = 'account-info';
            deleteButton.className = 'delete-button';

            // Set text content for email and account type
            emailElement.textContent = `Email: ${emailKey}`;
            accountTypeElement.textContent = `Account Type: ${accountType}`;
            deleteButton.textContent = 'Delete';

            // Add click event listener to delete the account
            deleteButton.addEventListener('click', () => {
                const confirmDeleteWorkAcc = confirm(`Are you sure you want to delete ${emailKey} account?`);
                if (confirmDeleteWorkAcc) {
                    // Remove from Realtime Database
                    remove(ref(database, 'workAccounts/' + childSnapshot.key))
                    .then(() => {
                        // Now delete the user from Firebase Authentication
                        deleteUserByEmail(emailKey, password)
                        .then(() => {
                            alert(`Account ${emailKey} deleted successfully.`);
                            displayAccounts(); // Refresh the list after deletion
                        })
                        .catch((error) => {
                            alert(`Failed to delete account from Authentication: ${error.message}`);
                        });
                    })
                    .catch((error) => {
                        alert(`Failed to delete account from Database: ${error.message}`);
                    });
                }
            });

            // Append the elements to the account info div
            accountInfo.appendChild(emailElement);
            accountInfo.appendChild(accountTypeElement);

            // Append the account info and delete button to the account card
            accountCard.appendChild(accountInfo);
            accountCard.appendChild(deleteButton);

            // Append the account card to the container
            accountsContainer.appendChild(accountCard);
        });
    }, {
        onlyOnce: false // This will keep the listener active to reflect real-time updates
    });
}

function deleteUserByEmail(email, password) {
    const auth = getAuth();

    // Trim and lowercase email for consistency
    const trimmedEmail = email.trim().toLowerCase();

    return new Promise((resolve, reject) => {
        // Sign in the user with email and password
        signInWithEmailAndPassword(auth, trimmedEmail, password)
            .then(userCredential => {
                const user = userCredential.user;

                // Successfully signed in, now delete the user
                return deleteUser(user);
            })
            .then(() => {
                resolve();
            })
            .catch(error => {
                console.error(`Failed to delete user with email: ${trimmedEmail}. Error: ${error.message}`);
                reject(error);
            });
    });
}


// Call the function to display accounts on page load
displayAccounts();