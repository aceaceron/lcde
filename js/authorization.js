import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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
const database = getDatabase();
const auth = getAuth();

// Redirect based on the current page
const currentPage = window.location.pathname.split('/').pop();

// Function to handle user redirection based on account type
function handleRedirect(accountType) {
    if (currentPage === 'admin.html' && accountType !== 'Admin') {
        window.location.href = 'employee.html'; // Redirect if not admin
    } else if (currentPage === 'employee.html' && accountType !== 'Employee') {
        window.location.href = 'admin.html'; // Redirect if not employee
    }
}

// Check if user is authenticated and redirect based on account type
onAuthStateChanged(auth, (user) => {
    if (user) {
        const email = user.email;
        const sanitizedEmail = email.replace('.', ','); // Replace '.' with ',' in email to use as key

        get(ref(database, 'workAccounts/' + sanitizedEmail)).then((snapshot) => {
            if (snapshot.exists()) {
                const accountType = snapshot.val().accountType;
                handleRedirect(accountType);
            } else {
                window.location.href = 'login.html'; // Redirect if no account data
            }
        }).catch((error) => {
            console.error('Error fetching account type:', error);
            window.location.href = 'login.html'; // Redirect on error
        });
    } else {
        window.location.href = 'login.html'; // Redirect if not authenticated
    }
});

// Add event listener for logout button
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'login.html'; // Redirect to login page or homepage
            }).catch((error) => {
                console.error('Logout error:', error);
            });
        });
    }
});
