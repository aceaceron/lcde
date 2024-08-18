import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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
        window.location.href = 'login.html';
    } else {
        // User is authenticated, check their role
        const userId = user.uid;
        const userRef = ref(database, 'users/' + userId);

        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const role = snapshot.val().role;
                const currentPage = window.location.pathname;

                if (role === "employee" && currentPage.includes('admin.html')) {
                    // Employee trying to access admin page
                    window.location.href = 'employee.html'; // Redirect to employee page
                } else if (role === "admin" && currentPage.includes('employee.html')) {
                    // Admin trying to access employee page
                    window.location.href = 'admin.html'; // Redirect to admin page
                } else {
                    console.log('User is authenticated:', user.email);
                }
            } else {
                console.error('No role found for this user');
            }
        }).catch((error) => {
            console.error('Error fetching user data:', error);
        });
    }
});

// Add event listener for logout button
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                // Sign-out successful.
                window.location.href = 'login.html';
            }).catch((error) => {
                // An error occurred
                console.error('Logout error:', error);
            });
        });
    }
});