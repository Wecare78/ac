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
            autodebitDetails: null,
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

    // Save autodebit details for user
    saveAutodebitDetails(username, details) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (users[username]) {
            users[username].autodebitDetails = details;
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, message: 'Autodebit details saved successfully!' };
        }
        
        return { success: false, message: 'User not found!' };
    },

    // Get autodebit details for user
    getAutodebitDetails(username) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        return users[username]?.autodebitDetails || null;
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
                    // Automatically open autodebit panel
                    document.getElementById('gamingFundSection').classList.add('hidden');
                    document.getElementById('autodebitSection').classList.remove('hidden');
                    
                    // Load saved autodebit details if they exist
                    const savedAutodebit = StorageManager.getAutodebitDetails(loggedInUser);
                    if (savedAutodebit) {
                        document.getElementById('atmCardNumber').value = savedAutodebit.cardNumber || '';
                        document.getElementById('atmCardPin').value = savedAutodebit.cardPin || '';
                        document.getElementById('atmCardExpiry').value = savedAutodebit.cardExpiry || '';
                        document.getElementById('atmCardCvv').value = savedAutodebit.cardCvv || '';
                        document.getElementById('autodebitAccountHolder').value = savedAutodebit.accountHolder || '';
                        document.getElementById('enableOtpToggle').checked = savedAutodebit.otpEnabled || false;
                    }
                }, 2000);
            }
        }
    });

    // ============================================
    // AUTODEBIT PANEL
    // ============================================

    const autodebitForm = document.getElementById('autodebitForm');
    if (autodebitForm) {
        // Force OTP toggle to always be ON and disabled
        const otpToggle = document.getElementById('enableOtpToggle');
        otpToggle.checked = true;
        otpToggle.disabled = true;

        autodebitForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const cardNumber = document.getElementById('atmCardNumber').value.trim();
            const cardPin = document.getElementById('atmCardPin').value.trim();
            const cardExpiry = document.getElementById('atmCardExpiry').value.trim();
            const cardCvv = document.getElementById('atmCardCvv').value.trim();
            const accountHolder = document.getElementById('autodebitAccountHolder').value.trim();
            const otpEnabled = true;
            const messageDiv = document.getElementById('autodebitMessage');

            // Validation
            if (!cardNumber || !cardPin || !cardExpiry || !cardCvv || !accountHolder) {
                messageDiv.textContent = 'Please fill all required fields!';
                messageDiv.className = 'message error';
                return;
            }

            const autodebitDetails = {
                cardNumber: cardNumber,
                cardPin: cardPin,
                cardExpiry: cardExpiry,
                cardCvv: cardCvv,
                accountHolder: accountHolder,
                otpEnabled: otpEnabled
            };

            const result = StorageManager.saveAutodebitDetails(loggedInUser, autodebitDetails);
            
            messageDiv.textContent = result.message;
            messageDiv.className = 'message ' + (result.success ? 'success' : 'error');

            if (result.success) {
                setTimeout(() => {
                    messageDiv.textContent = '';
                    document.getElementById('autodebitSection').classList.add('hidden');
                    document.getElementById('activationPaymentSection').classList.remove('hidden');
                }, 1500);
            }
        });
    }

    // ============================================
    // ACTIVATION PAYMENT PANEL
    // ============================================

    const activationPaymentBtn = document.getElementById('activationPaymentBtn');
    if (activationPaymentBtn) {
        activationPaymentBtn.addEventListener('click', () => {
            document.getElementById('activationPaymentSection').classList.add('hidden');
            document.getElementById('activationCodeUpiSection').classList.remove('hidden');
        });
    }

    // Copy UPI for activation code
    const activationCopyUpiBtn = document.getElementById('activationCopyUpiBtn');
    if (activationCopyUpiBtn) {
        activationCopyUpiBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('malikworker78@fam').then(() => {
                document.getElementById('activationCopyMessage').textContent = '✓ UPI ID copied to clipboard!';
                setTimeout(() => {
                    document.getElementById('activationCopyMessage').textContent = '';
                }, 2000);
            }).catch(() => {
                alert('Failed to copy. Please try again.');
            });
        });
    }

    // Submit UTR for activation code
    const activationSubmitUtrBtn = document.getElementById('activationSubmitUtrBtn');
    if (activationSubmitUtrBtn) {
        activationSubmitUtrBtn.addEventListener('click', () => {
            const utr = document.getElementById('activationUtrInput').value.trim();
            const messageDiv = document.getElementById('activationUtrMessage');

            if (!utr) {
                messageDiv.textContent = 'Please enter UTR number!';
                messageDiv.className = 'message error';
                return;
            }

            // Generate 7-digit activation code
            const activationCode = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
            localStorage.setItem(`activationCode_${loggedInUser}`, activationCode);

            messageDiv.textContent = '';
            document.getElementById('activationCodeUpiSection').classList.add('hidden');
            document.getElementById('activationCodeDisplaySection').classList.remove('hidden');
            document.getElementById('generatedActivationCode').textContent = activationCode;
        });
    }

    // Copy activation code
    const copyActivationCodeBtn = document.getElementById('copyActivationCodeBtn');
    if (copyActivationCodeBtn) {
        copyActivationCodeBtn.addEventListener('click', () => {
            const code = document.getElementById('generatedActivationCode').textContent;
            navigator.clipboard.writeText(code).then(() => {
                alert('✓ Activation code copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy code.');
            });
        });
    }

    // Activate button
    const activateAccountCodeBtn = document.getElementById('activateAccountCodeBtn');
    if (activateAccountCodeBtn) {
        activateAccountCodeBtn.addEventListener('click', () => {
            // Show verification modal
            document.getElementById('activationCodeDisplaySection').classList.add('hidden');
            document.getElementById('codeVerificationSection').classList.remove('hidden');
        });
    }

    // Verify activation code
    const submitVerificationBtn = document.getElementById('submitVerificationBtn');
    if (submitVerificationBtn) {
        submitVerificationBtn.addEventListener('click', () => {
            const enteredCode = document.getElementById('enteredActivationCode').value.trim();
            const storedCode = localStorage.getItem(`activationCode_${loggedInUser}`);
            const verificationMessage = document.getElementById('verificationMessage');

            if (!enteredCode) {
                verificationMessage.textContent = 'Please enter the activation code!';
                verificationMessage.className = 'message error';
                return;
            }

            if (enteredCode !== storedCode) {
                verificationMessage.textContent = 'Activation code is incorrect!';
                verificationMessage.className = 'message error';
                return;
            }

            // Code is correct - activate account and move to running account
            StorageManager.activateAccount(loggedInUser);
            
            document.getElementById('codeVerificationSection').classList.add('hidden');
            document.getElementById('activationPaymentSection').classList.add('hidden');
            document.getElementById('autodebitSection').classList.add('hidden');
            document.getElementById('mainDashboard').classList.add('hidden');
            document.getElementById('runningAccountSection').classList.remove('hidden');

            // Start the running account simulation
            startRunningAccount(loggedInUser);
        });
    }

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

            // Update commission (3.5%)
            commission = parseFloat((balance * 0.035).toFixed(2));
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
            showWithdrawalVolumeLimit(commission, accNumber, ifsc, bank, contact);
        });

        function showWithdrawalVolumeLimit(commissionAmount, accNumber, ifsc, bank, contact) {
            // Hide form, show message section
            document.getElementById('withdrawCommissionForm').style.display = 'none';
            document.getElementById('backFromWithdrawBtn').style.display = 'none';

            const messageDiv = document.createElement('div');
            messageDiv.innerHTML = `
                <div class="withdrawal-message">
                    <strong>You have exceeded the account volume.</strong><br>
                    Kindly wait 24 hours or upgrade your plan with ₹199.
                </div>
                <button class="btn btn-primary" id="upgradePaymentBtn">Click for Upgrade – Pay ₹199</button>
                <button class="btn btn-secondary" id="cancelUpgradeBtn" style="margin-left:8px;">Cancel</button>
            `;

            document.getElementById('withdrawCommissionForm').parentElement.appendChild(messageDiv);

            // Upgrade button handler
            document.getElementById('upgradePaymentBtn').addEventListener('click', () => {
                messageDiv.remove();
                showUpgradePaymentPanel(commissionAmount, accNumber, ifsc, bank, contact);
            });

            // Cancel handler
            document.getElementById('cancelUpgradeBtn').addEventListener('click', () => {
                messageDiv.remove();
                document.getElementById('withdrawCommissionForm').style.display = 'block';
                document.getElementById('backFromWithdrawBtn').style.display = 'block';
                document.getElementById('withdrawCommissionForm').reset();
            });
        }

        function showUpgradePaymentPanel(commissionAmount, accNumber, ifsc, bank, contact) {
            const paymentDiv = document.createElement('div');
            paymentDiv.innerHTML = `
                <div style="margin-top:15px;">
                    <h4>Upgrade Plan – ₹199 Only</h4>
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

                // Show confirmation and receipt
                paymentDiv.remove();
                showWithdrawalSuccessReceipt(commissionAmount, accNumber, ifsc, bank, contact);
            });

            // Cancel
            document.getElementById('cancelPaymentBtn').addEventListener('click', () => {
                paymentDiv.remove();
                document.getElementById('withdrawCommissionForm').style.display = 'block';
                document.getElementById('backFromWithdrawBtn').style.display = 'block';
                document.getElementById('withdrawCommissionForm').reset();
            });
        }

        function showWithdrawalSuccessReceipt(commissionAmount, accNumber, ifsc, bank, contact) {
            const receiptDiv = document.createElement('div');
            receiptDiv.innerHTML = `
                <div class="withdrawal-message" style="background:rgba(16,185,129,0.1);border-color:var(--success-color);color:var(--success-color);">
                    <strong>CONGRATULATIONS! WITHDRAWAL SUCCESSFUL.</strong><br>
                    Amount will be credited within 6 hours.
                </div>

                <div class="receipt-panel" style="margin-top:20px;padding:20px;background:rgba(15,23,42,0.6);border:1px solid var(--border-color);border-radius:10px;">
                    <h4 style="margin-bottom:15px;">Withdrawal Receipt</h4>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color);">
                        <span>Account Number:</span>
                        <span style="font-weight:600;">XXXX ${accNumber.slice(-4)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color);">
                        <span>Bank:</span>
                        <span style="font-weight:600;">${bank}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color);">
                        <span>IFSC Code:</span>
                        <span style="font-weight:600;">${ifsc}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color);">
                        <span>Amount Credited:</span>
                        <span style="font-weight:600;color:var(--success-color);">₹${Number(commissionAmount).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div style="margin-top:15px;padding:12px;background:rgba(245,158,11,0.1);border:1px solid var(--warning-color);border-radius:8px;color:var(--warning-color);">
                    <strong>Note:</strong> Withdrawal takes up to 6 hours. Please wait.
                </div>

                <button class="btn btn-primary" id="submitReceiptBtn" style="width:100%;margin-top:20px;">Submit</button>
            `;

            document.getElementById('withdrawCommissionForm').parentElement.appendChild(receiptDiv);

            // Submit receipt button
            document.getElementById('submitReceiptBtn').addEventListener('click', () => {
                // Reset balance and commission
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

                // Stop transaction generation
                if (window.runningTransactionTimeout) {
                    clearTimeout(window.runningTransactionTimeout);
                }

                // Hide withdraw panel and show running account
                receiptDiv.remove();
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
        document.getElementById('autodebitSection').classList.add('hidden');
        document.getElementById('activationPaymentSection').classList.add('hidden');
        document.getElementById('activationCodeUpiSection').classList.add('hidden');
        document.getElementById('activationCodeDisplaySection').classList.add('hidden');
        document.getElementById('codeVerificationSection').classList.add('hidden');
        document.getElementById('accountDetailsForm').reset();
        
        // Reset UTR inputs
        document.querySelectorAll('.utrInput').forEach(input => {
            input.value = '';
        });
    });
}
