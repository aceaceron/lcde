import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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

// Check if user is authenticated
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // User is not authenticated, redirect to login page
        window.location.href = '../lcde/login.html'; // or wherever your login page is
    } else {
        // User is authenticated, you can now access the page
        console.log('User is authenticated:', user.email);
    }
});

// Add event listener for logout button
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                // Sign-out successful.
                window.location.href = '../lcde/login.html'; // Redirect to login page or homepage
            }).catch((error) => {
                // An error occurred
                console.error('Logout error:', error);
            });
        });
    }
});
