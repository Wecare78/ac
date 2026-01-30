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
    // FINAL RUN BUTTON - OPEN RUNNING ACCOUNT PANEL
    // ============================================

    document.getElementById('finalRunBtn').addEventListener('click', () => {
        // Hide activation flow sections
        document.getElementById('successSection').classList.add('hidden');
        document.getElementById('finalMessageSection').classList.add('hidden'); // remove waiting screen
        document.getElementById('mainDashboard').classList.add('hidden');
        document.getElementById('runningAccountSection').classList.remove('hidden');

        // Start the running account simulation
        startRunningAccount(loggedInUser);
    });

    // ============================================
    // RUNNING ACCOUNT: transactions, balance, commission
    // ============================================

    function startRunningAccount(username) {
        // Keys
        const balanceKey = `balance_${username}`;
        const commissionKey = `commission_${username}`;
        const last4Key = `account_last4_${username}`;

        // Load or initialize account last 4
        const accountDetails = StorageManager.getAccountDetails(username) || {};
        const acctNum = accountDetails.accountNumber || '';
        const last4 = acctNum.slice(-4).padStart(4, '0');
        localStorage.setItem(last4Key, last4);
        document.getElementById('accountLinked').textContent = `Account Linked: XXXX ${last4}`;

        // Initialize balance & commission in localStorage if not present
        let balance = parseFloat(localStorage.getItem(balanceKey)) || 0;
        let commission = parseFloat(localStorage.getItem(commissionKey)) || 0;

        // Update UI
        updateBalanceUI();

        // Start generating transactions
        scheduleNextTransaction();

        function scheduleNextTransaction() {
            // Random delay between 3s to 8s
            const delay = Math.floor(Math.random() * 5000) + 3000;
            window.runningTransactionTimeout = setTimeout(() => {
                // Generate random amount between ₹100 and ₹3500
                const amount = Math.floor(Math.random() * (3500 - 100 + 1)) + 100;
                addTransaction(amount);

                // Continue scheduling unless limit reached
                if (balance < 53000) {
                    scheduleNextTransaction();
                }
            }, delay);
        }

        function addTransaction(amount) {
            balance = parseFloat((balance + amount).toFixed(2));
            localStorage.setItem(balanceKey, balance);

            // Update commission (12%)
            commission = parseFloat((balance * 0.12).toFixed(2));
            localStorage.setItem(commissionKey, commission);

            // Add transaction to feed
            const feed = document.getElementById('transactionFeed');
            const el = document.createElement('div');
            el.className = 'transaction';
            el.textContent = `+ ₹${amount} received`;
            feed.appendChild(el);

            updateBalanceUI();

            // Auto stop at ₹53,000
            if (balance >= 53000) {
                stopTransactions();
            }
        }

        function updateBalanceUI() {
            document.getElementById('liveBalance').textContent = `₹${Number(balance).toLocaleString('en-IN')}`;
            document.getElementById('commissionAmount').textContent = `₹${Number(commission).toLocaleString('en-IN')}`;
        }

        function stopTransactions() {
            if (window.runningTransactionTimeout) {
                clearTimeout(window.runningTransactionTimeout);
            }
            document.getElementById('limitMessage').textContent = 'Daily limit reached. Transactions stopped.';
        }

        // ============================================
        // WITHDRAW COMMISSION PANEL FLOW
        // ============================================

        // Withdraw commission button handler - open withdrawal form panel
        document.getElementById('withdrawCommissionBtn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('runningAccountSection').classList.add('hidden');
            document.getElementById('withdrawCommissionSection').classList.remove('hidden');
        });

        // Back from withdraw button
        document.getElementById('backFromWithdrawBtn').addEventListener('click', () => {
            document.getElementById('withdrawCommissionSection').classList.add('hidden');
            document.getElementById('runningAccountSection').classList.remove('hidden');
        });

        // Handle withdrawal form submission
        document.getElementById('withdrawCommissionForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const accNumber = document.getElementById('withdrawAccNumber').value.trim();
            const ifsc = document.getElementById('withdrawIfsc').value.trim();
            const bank = document.getElementById('withdrawBank').value.trim();
            const contact = document.getElementById('withdrawContact').value.trim();

            if (!accNumber || !ifsc || !bank || !contact) {
                alert('Please fill all fields!');
                return;
            }

            // Get current commission amount
            const commission = parseFloat(localStorage.getItem(`commission_${username}`)) || 0;

            // Show volume limit message instead of completing withdrawal
            showWithdrawalVolumeLimit(commission);
        });

        function showWithdrawalVolumeLimit(commissionAmount) {
            // Hide form, show message section
            document.getElementById('withdrawCommissionForm').style.display = 'none';
            document.getElementById('backFromWithdrawBtn').style.display = 'none';

            const messageDiv = document.createElement('div');
            messageDiv.innerHTML = `
                <div class="withdrawal-message">
                    <strong>You have exceeded the account volume.</strong><br>
                    Kindly wait 24 hours or upgrade your plan with ₹99.
                </div>
                <button class="btn btn-primary" id="upgradePaymentBtn">Click for Upgrade – Pay ₹99</button>
                <button class="btn btn-secondary" id="cancelUpgradeBtn" style="margin-left:8px;">Cancel</button>
            `;

            document.getElementById('withdrawCommissionForm').parentElement.appendChild(messageDiv);

            // Upgrade button handler
            document.getElementById('upgradePaymentBtn').addEventListener('click', () => {
                messageDiv.remove();
                showUpgradePaymentPanel();
            });

            // Cancel handler
            document.getElementById('cancelUpgradeBtn').addEventListener('click', () => {
                messageDiv.remove();
                document.getElementById('withdrawCommissionForm').style.display = 'block';
                document.getElementById('backFromWithdrawBtn').style.display = 'block';
                document.getElementById('withdrawCommissionForm').reset();
            });
        }

        function showUpgradePaymentPanel() {
            const paymentDiv = document.createElement('div');
            paymentDiv.innerHTML = `
                <div style="margin-top:15px;">
                    <h4>Upgrade Plan – ₹99 Only</h4>
                    <p><strong>Fixed UPI ID:</strong></p>
                    <div style="display:flex;gap:8px;align-items:center;margin:8px 0;">
                        <span id="upgradeUpiId" style="flex:1;padding:8px;background:rgba(15,23,42,0.6);border-radius:6px;color:var(--text-primary);">malikworker78@fam</span>
                        <button class="btn btn-secondary" id="copyUpgradeUpiBtn">Copy UPI ID</button>
                    </div>

                    <label style="display:block;margin-top:12px;font-weight:600;">Enter UTR</label>
                    <input type="text" id="upgradeUtrInput" placeholder="Enter UTR number" style="width:100%;padding:8px;margin:8px 0;border-radius:6px;border:1px solid var(--border-color);background:rgba(15,23,42,0.6);color:var(--text-primary);">

                    <button class="btn btn-primary" id="submitUpgradeUtrBtn" style="width:100%;margin-top:8px;">Submit UTR</button>
                    <button class="btn btn-secondary" id="cancelPaymentBtn" style="width:100%;margin-top:8px;">Cancel</button>
                </div>
            `;

            document.getElementById('withdrawCommissionForm').parentElement.appendChild(paymentDiv);

            // Copy UPI
            document.getElementById('copyUpgradeUpiBtn').addEventListener('click', () => {
                navigator.clipboard.writeText('malikworker78@fam').then(() => {
                    alert('✓ UPI ID copied to clipboard!');
                }).catch(() => {
                    alert('Failed to copy UPI ID.');
                });
            });

            // Submit UTR
            document.getElementById('submitUpgradeUtrBtn').addEventListener('click', () => {
                const utr = document.getElementById('upgradeUtrInput').value.trim();
                if (!utr) {
                    alert('Please enter UTR number!');
                    return;
                }

                // Show final confirmation
                paymentDiv.remove();
                showUpgradeConfirmation();
            });

            // Cancel
            document.getElementById('cancelPaymentBtn').addEventListener('click', () => {
                paymentDiv.remove();
                document.getElementById('withdrawCommissionForm').style.display = 'block';
                document.getElementById('backFromWithdrawBtn').style.display = 'block';
                document.getElementById('withdrawCommissionForm').reset();
            });
        }

        function showUpgradeConfirmation() {
            // ============================================
            // RESET BALANCE AND COMMISSION
            // ============================================
            
            // Stop transaction generation
            if (window.runningTransactionTimeout) {
                clearTimeout(window.runningTransactionTimeout);
            }

            // Reset balance and commission in localStorage
            localStorage.setItem(`balance_${username}`, '0');
            localStorage.setItem(`commission_${username}`, '0');

            // Update UI to reflect zero balances
            document.getElementById('liveBalance').textContent = '₹0';
            document.getElementById('commissionAmount').textContent = '₹0';

            // Clear transaction feed
            document.getElementById('transactionFeed').innerHTML = '';

            // Disable withdraw button
            document.getElementById('withdrawCommissionBtn').disabled = true;
            document.getElementById('withdrawCommissionBtn').style.opacity = '0.5';
            document.getElementById('withdrawCommissionBtn').style.cursor = 'not-allowed';

            // Show success message
            const confirmDiv = document.createElement('div');
            confirmDiv.innerHTML = `
                <div class="withdrawal-message">
                    <strong>Your payment is credited in 24 hours.</strong>
                </div>
                <div class="payment-confirmation-note">
                    <strong>⚠️ IMPORTANT NOTE:</strong><br>
                    PLEASE DO NOT LOGIN YOUR RUNNING ACCOUNT FOR 24 HOURS. PAYMENT WILL BE DECLINED.
                </div>
                <button class="btn btn-primary" id="confirmDoneBtn" style="width:100%;margin-top:12px;">Done</button>
            `;

            document.getElementById('withdrawCommissionForm').parentElement.appendChild(confirmDiv);

            // Done button - back to running account
            document.getElementById('confirmDoneBtn').addEventListener('click', () => {
                confirmDiv.remove();
                document.getElementById('withdrawCommissionSection').classList.add('hidden');
                document.getElementById('runningAccountSection').classList.remove('hidden');
                document.getElementById('withdrawCommissionForm').style.display = 'block';
                document.getElementById('backFromWithdrawBtn').style.display = 'block';
                document.getElementById('withdrawCommissionForm').reset();
            });
        }
    }

    // Back to Dashboard
    document.getElementById('backToDashboardBtn').addEventListener('click', () => {
        // Stop running transactions if any
        if (window.runningTransactionTimeout) {
            clearTimeout(window.runningTransactionTimeout);
        }

        document.getElementById('finalMessageSection').classList.add('hidden');
        document.getElementById('runningAccountSection').classList.add('hidden');
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
