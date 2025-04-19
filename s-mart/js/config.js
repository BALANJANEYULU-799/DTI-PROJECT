// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Global State
let isLoggedIn = false;
let currentUser = null;

// Utility Functions
function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px; border-radius: 5px;
        background: ${type === "error" ? "#ef5350" : "#4caf50"}; color: white; z-index: 3000;
        animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-out 2.7s forwards;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function logError(message, error) {
    console.error(`${message}:`, error);
    showNotification(`Error: ${message}`, "error");
}