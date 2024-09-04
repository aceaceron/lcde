// Section 1: Intersection Observer for Scroll Animations
function handleIntersection(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);  // Optional: Stops observing after element is in view
        }
    });
}

const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver(handleIntersection, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.info, .backgroundphoto, .content, .container3-content, .comment-box, .comments-list, .container3 .container3-content .gallery-item img, .container5, .container6');
    elements.forEach(element => observer.observe(element));

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });


});
var today = new Date();

// Calculate tomorrow's date
var tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

// Calculate the date 60 days from today
var maxDate = new Date(today);
maxDate.setDate(today.getDate() + 60);

// Format tomorrow's date as yyyy-mm-dd
var ddTomorrow = String(tomorrow.getDate()).padStart(2, '0');
var mmTomorrow = String(tomorrow.getMonth() + 1).padStart(2, '0');
var yyyyTomorrow = tomorrow.getFullYear();
var tomorrowFormatted = yyyyTomorrow + '-' + mmTomorrow + '-' + ddTomorrow;

// Format the max date as yyyy-mm-dd
var ddMax = String(maxDate.getDate()).padStart(2, '0');
var mmMax = String(maxDate.getMonth() + 1).padStart(2, '0');
var yyyyMax = maxDate.getFullYear();
var maxDateFormatted = yyyyMax + '-' + mmMax + '-' + ddMax;

// Set the min and max attributes of the date input
var dateInput = document.getElementById('date');
dateInput.setAttribute('min', tomorrowFormatted);
dateInput.setAttribute('max', maxDateFormatted);

// Section 3: Terms and Conditions Popup
const popup = document.getElementById('terms-popup');
const tac = document.querySelector('.tac');
const closeBtn = document.querySelector('.close-btn');

tac.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the default anchor behavior
    popup.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === popup) {
        popup.style.display = 'none';
    }
});

// Section 4: Event Rental Reservation Popup
const popup2 = document.getElementById('event-popup');
const eventtac = document.querySelector('.eventtac');
const closeBtn2 = document.querySelector('.close-btn2');

eventtac.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the default anchor behavior
    popup2.style.display = 'block';
});

closeBtn2.addEventListener('click', () => {
    popup2.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === popup) {
        popup2.style.display = 'none';
    }
});


document.querySelector('.menu-button').addEventListener('click', function () {
    this.classList.toggle('active');

    const dropdownMenu = document.querySelector('.dropdown-nav');
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
});

// Handle link clicks inside the dropdown to auto-hide
document.querySelectorAll('.dropdown-nav a').forEach(link => {
    link.addEventListener('click', function () {
        // Hide the dropdown menu
        document.querySelector('.dropdown-nav').style.display = 'none';

        // Remove the active class from the menu button
        document.querySelector('.menu-button').classList.remove('active');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const dropdownDarkModeToggle = document.getElementById('dropdownDarkModeToggle');

    const updateToggleText = (isDarkMode) => {
        const toggleText = isDarkMode ? 'Light Mode' : 'Dark Mode';
        darkModeToggle.textContent = toggleText;
        dropdownDarkModeToggle.textContent = toggleText;
    };

    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        updateToggleText(isDarkMode);
    };

    darkModeToggle.addEventListener('click', toggleDarkMode);
    dropdownDarkModeToggle.addEventListener('click', toggleDarkMode);

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        updateToggleText(true);
    } else {
        updateToggleText(false);
    }
});

