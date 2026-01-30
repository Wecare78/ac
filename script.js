// ============================================
// LOCAL STORAGE MANAGEMENT
// ============================================

const StorageManager = {
    // Initialize storage with empty data if needed
    init() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify({}));
        }
        if (!localStorage.getItem('loggedInUser')) {
            localStorage.setItem('loggedInUser', null);
        }
    },

    // Register a new user
    registerUser(email, username, password) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        // Check if username already exists
        if (users[username]) {
            return { success: false, message: 'Username already exists!' };
        }

        // Check if email already exists
        const emailExists = Object.values(users).some(user => user.email === email);
        if (emailExists) {
            return { success: false, message: 'Email already registered!' };
        }

        // Store new user
        users[username] = {
            email: email,
            password: password, // In production, this should be hashed
            username: username,
            accountDetails: null,
            activated: false
        };

        localStorage.setItem('users', JSON.stringify(users));
        return { success: true, message: 'Registration successful! Please login.' };
    },

    // Login user
    loginUser(username, password) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (!users[username]) {
            return { success: false, message: 'Username not found!' };
        }

        if (users[username].password !== password) {
            return { success: false, message: 'Incorrect password!' };
        }

        localStorage.setItem('loggedInUser', username);
        return { success: true, message: 'Login successful!' };
    },

    // Get logged in user
    getLoggedInUser() {
        return localStorage.getItem('loggedInUser');
    },

    // Logout user
    logout() {
        localStorage.setItem('loggedInUser', null);
    },

    // Save account details for user
    saveAccountDetails(username, details) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (users[username]) {
            users[username].accountDetails = details;
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, message: 'Account details saved successfully!' };
        }
        
        return { success: false, message: 'User not found!' };
    },

    // Get account details for user
    getAccountDetails(username) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        return users[username]?.accountDetails || null;
    },

    // Mark account as activated
    activateAccount(username) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (users[username]) {
            users[username].activated = true;
            localStorage.setItem('users', JSON.stringify(users));
            return true;
        }
        
        return false;
    }
};

// ============================================
// INDEX PAGE FUNCTIONALITY
// ============================================

if (document.getElementById('registerForm')) {
    // Initialize storage
    StorageManager.init();

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(tabName + 'Tab').classList.add('active');
        });
    });

    // Registration form handling
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('regEmail').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const messageDiv = document.getElementById('registerMessage');

        // Reset error messages
        document.getElementById('emailError').textContent = '';
        document.getElementById('usernameError').textContent = '';
        document.getElementById('passwordError').textContent = '';

        // Validation
        let hasError = false;

        if (!email || !email.includes('@')) {
            document.getElementById('emailError').textContent = 'Please enter a valid email!';
            hasError = true;
        }

        if (!username || username.length < 3) {
            document.getElementById('usernameError').textContent = 'Username must be at least 3 characters!';
            hasError = true;
        }

        if (!password || password.length < 4) {
            document.getElementById('passwordError').textContent = 'Password must be at least 4 characters!';
            hasError = true;
        }

        if (hasError) return;

        // Register user
        const result = StorageManager.registerUser(email, username, password);
        
        messageDiv.textContent = result.message;
        messageDiv.className = 'message ' + (result.success ? 'success' : 'error');

        if (result.success) {
            registerForm.reset();
            setTimeout(() => {
                document.querySelector('[data-tab="login"]').click();
                messageDiv.textContent = '';
            }, 1500);
        }
    });

    // Login form handling
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const messageDiv = document.getElementById('loginMessage');

        // Reset error messages
        document.getElementById('loginUsernameError').textContent = '';
        document.getElementById('loginPasswordError').textContent = '';

        // Validation
        let hasError = false;

        if (!username) {
            document.getElementById('loginUsernameError').textContent = 'Please enter username!';
            hasError = true;
        }

        if (!password) {
            document.getElementById('loginPasswordError').textContent = 'Please enter password!';
            hasError = true;
        }

        if (hasError) return;

        // Login user
        const result = StorageManager.loginUser(username, password);
        
        messageDiv.textContent = result.message;
        messageDiv.className = 'message ' + (result.success ? 'success' : 'error');

        if (result.success) {
            loginForm.reset();
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    });
}

// ============================================
// DASHBOARD PAGE FUNCTIONALITY
// ============================================

if (document.getElementById('welcomeMessage')) {
    // Initialize storage
    StorageManager.init();

    // Check if user is logged in
    const loggedInUser = StorageManager.getLoggedInUser();
    if (!loggedInUser) {
        window.location.href = 'index.html';
    }

    // Set welcome message
    document.getElementById('welcomeMessage').textContent = `WELCOME ${loggedInUser.toUpperCase()}`;

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        StorageManager.logout();
        window.location.href = 'index.html';
    });

    // Gaming Fund button
    document.getElementById('gamingFundBtn').addEventListener('click', () => {
        document.getElementById('mainDashboard').classList.add('hidden');
        document.getElementById('gamingFundSection').classList.remove('hidden');

        // Load saved account details if they exist
        const savedDetails = StorageManager.getAccountDetails(loggedInUser);
        if (savedDetails) {
            document.getElementById('accountNumber').value = savedDetails.accountNumber || '';
            document.getElementById('ifscCode').value = savedDetails.ifscCode || '';
            document.getElementById('accountHolder').value = savedDetails.accountHolder || '';
            document.getElementById('bankName').value = savedDetails.bankName || '';
            document.getElementById('contactNumber').value = savedDetails.contactNumber || '';
        }
    });

    // Account Details Form
    const accountDetailsForm = document.getElementById('accountDetailsForm');
    accountDetailsForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const accountNumber = document.getElementById('accountNumber').value.trim();
        const ifscCode = document.getElementById('ifscCode').value.trim();
        const accountHolder = document.getElementById('accountHolder').value.trim();
        const bankName = document.getElementById('bankName').value.trim();
        const contactNumber = document.getElementById('contactNumber').value.trim();
        const qrCodeInput = document.getElementById('qrCode');

        const messageDiv = document.getElementById('accountDetailsMessage');

        // Validation
        if (!accountNumber || !ifscCode || !accountHolder || !bankName || !contactNumber) {
            messageDiv.textContent = 'Please fill all required fields!';
            messageDiv.className = 'message error';
            return;
        }

        // Handle QR code (optional)
        let qrCodeData = null;
        if (qrCodeInput.files && qrCodeInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                qrCodeData = e.target.result;
                saveAccountDetails(qrCodeData);
            };
            reader.readAsDataURL(qrCodeInput.files[0]);
        } else {
            saveAccountDetails(null);
        }

        function saveAccountDetails(qrCode) {
            const details = {
                accountNumber: accountNumber,
                ifscCode: ifscCode,
                accountHolder: accountHolder,
                bankName: bankName,
                contactNumber: contactNumber,
                qrCode: qrCode
            };

            const result = StorageManager.saveAccountDetails(loggedInUser, details);
            
            messageDiv.textContent = result.message;
            messageDiv.className = 'message ' + (result.success ? 'success' : 'error');

            if (result.success) {
                setTimeout(() => {
                    messageDiv.textContent = '';
                }, 2000);
            }
        }
    });

    // Run Account Live button
    document.getElementById('runAccountBtn').addEventListener('click', () => {
        document.getElementById('gamingFundSection').classList.add('hidden');
        document.getElementById('activationSection').classList.remove('hidden');
    });

    // ============================================
    // NEW AND OLD USER PAYMENT FLOW
    // ============================================

    // New User Offer button - reveal payment details
    document.getElementById('newUserOfferBtn').addEventListener('click', () => {
        const paymentDetails = document.getElementById('newUserPaymentDetails');
        const oldUserDetails = document.getElementById('oldUserPaymentDetails');
        
        // Toggle new user payment details
        paymentDetails.classList.toggle('hidden');
        
        // Hide old user payment details if visible
        if (!oldUserDetails.classList.contains('hidden')) {
            oldUserDetails.classList.add('hidden');
        }
    });

    // Old User Offer button - reveal payment details
    document.getElementById('oldUserOfferBtn').addEventListener('click', () => {
        const paymentDetails = document.getElementById('oldUserPaymentDetails');
        const newUserDetails = document.getElementById('newUserPaymentDetails');
        
        // Toggle old user payment details
        paymentDetails.classList.toggle('hidden');
        
        // Hide new user payment details if visible
        if (!newUserDetails.classList.contains('hidden')) {
            newUserDetails.classList.add('hidden');
        }
    });

    // ============================================
    // UPI COPY FUNCTIONALITY FOR ALL COPY BUTTONS
    // ============================================

    document.querySelectorAll('.copyUpiBtn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const upiId = button.parentElement.querySelector('.upiId').textContent;
            const copyMessage = button.parentElement.parentElement.querySelector('.copyMessage');
            
            navigator.clipboard.writeText(upiId).then(() => {
                copyMessage.textContent = '✓ UPI ID copied to clipboard!';
                setTimeout(() => {
                    copyMessage.textContent = '';
                }, 2000);
            }).catch(() => {
                alert('Failed to copy. Please try again.');
            });
        });
    });

    // ============================================
    // UTR SUBMISSION FOR BOTH OFFERS
    // ============================================

    document.querySelectorAll('.submitUtrBtn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the parent offer card and UTR input
            const offerCard = button.closest('.payment-details');
            const utrInput = offerCard.querySelector('.utrInput').value.trim();
            const utrMessage = offerCard.querySelector('.utrMessage');

            if (!utrInput) {
                utrMessage.textContent = 'Please enter UTR number!';
                utrMessage.className = 'message error';
                return;
            }

            // Activate account
            StorageManager.activateAccount(loggedInUser);

            // Show success section
            document.getElementById('activationSection').classList.add('hidden');
            document.getElementById('successSection').classList.remove('hidden');

            utrMessage.textContent = '';
        });
    });

    // ============================================
    // FINAL RUN BUTTON - START 90 MINUTE TIMER
    // ============================================

    document.getElementById('finalRunBtn').addEventListener('click', () => {
        document.getElementById('successSection').classList.add('hidden');
        document.getElementById('finalMessageSection').classList.remove('hidden');
        
        // Start the timer
        startCountdownTimer(loggedInUser);
    });

    // ============================================
    // 90 MINUTE COUNTDOWN TIMER
    // ============================================

    function startCountdownTimer(username) {
        const timerDisplay = document.getElementById('finalMessageSection').querySelector('.final-message');
        const storageKey = `timer_${username}`;
        
        // Get or create timer start time
        let timerStartTime = localStorage.getItem(storageKey);
        if (!timerStartTime) {
            timerStartTime = Date.now();
            localStorage.setItem(storageKey, timerStartTime);
        } else {
            timerStartTime = parseInt(timerStartTime);
        }

        // Update timer every second
        function updateTimer() {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - timerStartTime) / 1000);
            const totalSeconds = 90 * 60; // 90 minutes in seconds
            const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

            if (remainingSeconds === 0) {
                // Timer finished
                timerDisplay.innerHTML = '<strong>✅ Your account is now live.</strong>';
                clearInterval(timerInterval);
                localStorage.removeItem(storageKey);
            } else {
                // Calculate minutes and seconds
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                timerDisplay.innerHTML = `Your account will be run in ${timeString}.<br>Please come back after 90 minutes.`;
            }
        }

        // Initial update
        updateTimer();

        // Update every second
        const timerInterval = setInterval(updateTimer, 1000);
        
        // Store interval ID for cleanup if needed
        window.currentTimerInterval = timerInterval;
    }

    // Check if there's an ongoing timer when page loads
    const timerStorageKey = `timer_${loggedInUser}`;
    if (localStorage.getItem(timerStorageKey)) {
        // If on final message section, resume timer
        if (!document.getElementById('finalMessageSection').classList.contains('hidden')) {
            startCountdownTimer(loggedInUser);
        }
    }

    // Back to Dashboard
    document.getElementById('backToDashboardBtn').addEventListener('click', () => {
        // Stop the timer if running
        if (window.currentTimerInterval) {
            clearInterval(window.currentTimerInterval);
        }
        
        document.getElementById('finalMessageSection').classList.add('hidden');
        document.getElementById('mainDashboard').classList.remove('hidden');
        
        // Reset all sections
        document.getElementById('gamingFundSection').classList.add('hidden');
        document.getElementById('activationSection').classList.add('hidden');
        document.getElementById('successSection').classList.add('hidden');
        document.getElementById('accountDetailsForm').reset();
        
        // Reset payment details visibility
        document.getElementById('newUserPaymentDetails').classList.add('hidden');
        document.getElementById('oldUserPaymentDetails').classList.add('hidden');
        
        // Reset UTR inputs
        document.querySelectorAll('.utrInput').forEach(input => {
            input.value = '';
        });
    });
}
