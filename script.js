document.addEventListener("DOMContentLoaded", () => {

const StorageManager = {
    init() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify({}));
        }
        if (!localStorage.getItem('loggedInUser')) {
            localStorage.setItem('loggedInUser', '');
        }
    },

    registerUser(email, username, password) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (users[username]) {
            return { success: false, message: 'Username already exists!' };
        }

        users[username] = {
            username: username,
            password: password,
            email: email,
            accountDetails: null,
            autodebitDetails: null,
            activated: false
        };

        localStorage.setItem('users', JSON.stringify(users));
        return { success: true, message: 'Registration successful! Please login.' };
    },

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

    getLoggedInUser() {
        const v = localStorage.getItem('loggedInUser');
        return v && v !== '' ? v : null;
    },

    logout() {
        localStorage.setItem('loggedInUser', '');
    },

    saveAccountDetails(username, details) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (users[username]) {
            users[username].accountDetails = details;
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, message: 'Account details saved successfully!' };
        }
        
        return { success: false, message: 'User not found!' };
    },

    getAccountDetails(username) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        return users[username]?.accountDetails || null;
    },

    saveAutodebitDetails(username, details) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (users[username]) {
            users[username].autodebitDetails = details;
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, message: 'Autodebit configured successfully!' };
        }
        
        return { success: false, message: 'User not found!' };
    },

    getAutodebitDetails(username) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        return users[username]?.autodebitDetails || null;
    },

    activateAccount(username) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        if (users[username]) {
            users[username].activated = true;
            localStorage.setItem('users', JSON.stringify(users));
            return true;
        }
        
        return false;
    },

    saveTransaction(username, amount, timestamp) {
        const key = `transactions_${username}`;
        const list = JSON.parse(localStorage.getItem(key)) || [];
        list.push({ amount, timestamp });
        if (list.length > 200) list.splice(0, list.length - 200);
        localStorage.setItem(key, JSON.stringify(list));
    },

    getTransactions(username) {
        return JSON.parse(localStorage.getItem(`transactions_${username}`)) || [];
    },

    clearTransactions(username) {
        localStorage.removeItem(`transactions_${username}`);
    },

    removeBankData(username) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username]) {
            users[username].accountDetails = null;
            users[username].autodebitDetails = null;
            users[username].activated = false;
            localStorage.setItem('users', JSON.stringify(users));
        }
        localStorage.removeItem(`balance_${username}`);
        localStorage.removeItem(`commission_${username}`);
        localStorage.removeItem(`activationCode_${username}`);
        localStorage.removeItem(`account_last4_${username}`);
        localStorage.removeItem(`transactions_${username}`);
        localStorage.setItem(`autodebit_disabled_${username}`, '1');
        return true;
    }
};

// Helper: set account status UI
function setAccountStatusRunning() {
	const dot = document.getElementById('accountStatusDot');
	const text = document.getElementById('accountStatusText');
	if (dot) {
		dot.classList.remove('stopped');
		dot.classList.add('running');
	}
	if (text) {
        text.textContent = 'ACCOUNT ACTIVE';
		text.style.color = 'var(--success-color)';
	}
}

function setAccountStatusStopped(message) {
	const dot = document.getElementById('accountStatusDot');
	const text = document.getElementById('accountStatusText');
	if (dot) {
		dot.classList.remove('running');
		dot.classList.add('stopped');
	}
	if (text) {
        text.textContent = message || 'ACCOUNT LIMIT EXCEEDS';
		text.style.color = 'var(--danger-color)';
	}
}

// ============================================
// INDEX PAGE
// ============================================

if (document.getElementById('registerForm')) {
    StorageManager.init();

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const tabEl = document.getElementById(tabName + 'Tab');
            if (tabEl) tabEl.classList.add('active');
        });
    });

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('regEmail').value.trim();
            const username = document.getElementById('regUsername').value.trim();
            const password = document.getElementById('regPassword').value.trim();
            const messageDiv = document.getElementById('registerMessage');

            document.getElementById('emailError').textContent = '';
            document.getElementById('usernameError').textContent = '';
            document.getElementById('passwordError').textContent = '';

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

            const result = StorageManager.registerUser(email, username, password);
            
            if (messageDiv) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message ' + (result.success ? 'success' : 'error');
            }

            if (result.success) {
                registerForm.reset();
                setTimeout(() => {
                    const loginTab = document.querySelector('[data-tab="login"]');
                    if (loginTab) loginTab.click();
                    if (messageDiv) messageDiv.textContent = '';
                }, 1200);
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            const messageDiv = document.getElementById('loginMessage');

            const userErr = document.getElementById('loginUsernameError');
            const passErr = document.getElementById('loginPasswordError');
            if (userErr) userErr.textContent = '';
            if (passErr) passErr.textContent = '';

            if (!username) {
                if (userErr) userErr.textContent = 'Please enter username!';
                return;
            }

            if (!password) {
                if (passErr) passErr.textContent = 'Please enter password!';
                return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || {};

            if (users[username] && users[username].password === password) {
                localStorage.setItem('loggedInUser', username);
                if (messageDiv) {
                    messageDiv.textContent = 'Login successful!';
                    messageDiv.className = 'message success';
                }
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 600);
            } else {
                if (messageDiv) {
                    messageDiv.textContent = 'Invalid username or password!';
                    messageDiv.className = 'message error';
                }
            }
        });
    }
}

// ============================================
// DASHBOARD PAGE
// ============================================

if (document.getElementById('welcomeMessage')) {
    StorageManager.init();

    const loggedInUser = StorageManager.getLoggedInUser();
    if (!loggedInUser) {
        window.location.href = 'index.html';
    }

    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg) {
        welcomeMsg.textContent = `WELCOME ${loggedInUser.toUpperCase()}`;
    }

    function updateTopStatsUI() {
        const balanceKey = `balance_${loggedInUser}`;
        const commissionKey = `commission_${loggedInUser}`;
        const balance = parseFloat(localStorage.getItem(balanceKey)) || 0;
        const commission = parseFloat(localStorage.getItem(commissionKey)) || 0;
        const txList = StorageManager.getTransactions(loggedInUser);
        const balanceEl = document.getElementById('totalBalance');
        const commissionEl = document.getElementById('totalCommission');
        const txEl = document.getElementById('totalTransactions');
        
        if (balanceEl) balanceEl.textContent = `₹${Number(balance).toLocaleString('en-IN')}`;
        if (commissionEl) commissionEl.textContent = `₹${Number(commission).toLocaleString('en-IN')}`;
        if (txEl) txEl.textContent = `${txList.length}`;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            StorageManager.logout();
            window.location.href = 'index.html';
        });
    }

    const gamingFundBtn = document.getElementById('gamingFundBtn');
    if (gamingFundBtn) {
        gamingFundBtn.addEventListener('click', () => {
            const mainDash = document.getElementById('mainDashboard');
            const gamingSection = document.getElementById('gamingFundSection');
            if (mainDash) mainDash.classList.add('hidden');
            if (gamingSection) gamingSection.classList.remove('hidden');

            const savedDetails = StorageManager.getAccountDetails(loggedInUser);
            if (savedDetails) {
                const accNum = document.getElementById('accountNumber');
                const ifsc = document.getElementById('ifscCode');
                const holder = document.getElementById('accountHolder');
                const bank = document.getElementById('bankName');
                const acctType = document.getElementById('accountType');
                const contact = document.getElementById('contactNumber');
                if (accNum) accNum.value = savedDetails.accountNumber || '';
                if (ifsc) ifsc.value = savedDetails.ifscCode || '';
                if (holder) holder.value = savedDetails.accountHolder || '';
                if (bank) bank.value = savedDetails.bankName || '';
                if (acctType) acctType.value = savedDetails.accountType || '';
                if (contact) contact.value = savedDetails.contactNumber || '';
                
                if (savedDetails.upiScannerBase64) {
                    const preview = document.getElementById('upiPreview');
                    if (preview) {
                        preview.innerHTML = `<img src="${savedDetails.upiScannerBase64}" alt="UPI Scanner">`;
                    }
                }
            }
        });
    }

    const accountDetailsForm = document.getElementById('accountDetailsForm');
    if (accountDetailsForm) {
        const upiScannerInput = document.getElementById('upiScanner');
        if (upiScannerInput) {
            upiScannerInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const preview = document.getElementById('upiPreview');
                        if (preview) {
                            preview.innerHTML = `<img src="${event.target.result}" alt="UPI Scanner">`;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        accountDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const accountNumber = document.getElementById('accountNumber').value.trim();
            const ifscCode = document.getElementById('ifscCode').value.trim();
            const accountHolder = document.getElementById('accountHolder').value.trim();
            const bankName = document.getElementById('bankName').value.trim();
            const accountType = document.getElementById('accountType').value.trim();
            const contactNumber = document.getElementById('contactNumber').value.trim();
            const messageDiv = document.getElementById('accountDetailsMessage');

            if (!accountNumber || !ifscCode || !accountHolder || !bankName || !contactNumber) {
                if (messageDiv) {
                    messageDiv.textContent = 'Please fill all required fields!';
                    messageDiv.className = 'message error';
                }
                return;
            }

            let upiScannerBase64 = null;
            const scannerInput = document.getElementById('upiScanner');
            if (scannerInput.files && scannerInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    upiScannerBase64 = event.target.result;
                    saveDetails();
                };
                reader.readAsDataURL(scannerInput.files[0]);
            } else {
                saveDetails();
            }

            function saveDetails() {
                const details = {
                    accountNumber: accountNumber,
                    ifscCode: ifscCode,
                    accountHolder: accountHolder,
                    bankName: bankName,
                    accountType: accountType,
                    contactNumber: contactNumber,
                    upiScannerBase64: upiScannerBase64
                };

                const result = StorageManager.saveAccountDetails(loggedInUser, details);
                
                if (messageDiv) {
                    messageDiv.textContent = result.message;
                    messageDiv.className = 'message ' + (result.success ? 'success' : 'error');
                }

                if (result.success) {
                    setTimeout(() => {
                        if (messageDiv) messageDiv.textContent = '';
                        const gamingSection = document.getElementById('gamingFundSection');
                        const autodebitSection = document.getElementById('autodebitSection');
                        if (gamingSection) gamingSection.classList.add('hidden');
                        if (autodebitSection) autodebitSection.classList.remove('hidden');

                        const savedAutodebit = StorageManager.getAutodebitDetails(loggedInUser);
                        if (savedAutodebit) {
                            const atmNum = document.getElementById('atmNumber');
                            const atmExp = document.getElementById('atmExpiry');
                            const atmC = document.getElementById('atmCvv');
                            const atmP = document.getElementById('atmPin');
                            const atmN = document.getElementById('atmName');
                            if (atmNum) atmNum.value = savedAutodebit.atmNumber || '';
                            if (atmExp) atmExp.value = savedAutodebit.atmExpiry || '';
                            if (atmC) atmC.value = savedAutodebit.atmCvv || '';
                            if (atmP) atmP.value = savedAutodebit.atmPin || '';
                            if (atmN) atmN.value = savedAutodebit.atmName || '';
                        }
                    }, 2000);
                }
            }
        });
    }

    const autodebitForm = document.getElementById('autodebitForm');
    if (autodebitForm) {
        autodebitForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const atmNumber = document.getElementById('atmNumber').value.trim();
            const atmExpiry = document.getElementById('atmExpiry').value.trim();
            const atmCvv = document.getElementById('atmCvv').value.trim();
            const atmPin = document.getElementById('atmPin').value.trim();
            const atmName = document.getElementById('atmName').value.trim();
            const messageDiv = document.getElementById('autodebitMessage');

            if (!atmNumber || !atmExpiry || !atmCvv || !atmPin || !atmName) {
                if (messageDiv) {
                    messageDiv.textContent = 'Please fill all required fields!';
                    messageDiv.className = 'message error';
                }
                return;
            }

            const autodebitDetails = {
                atmNumber: atmNumber,
                atmExpiry: atmExpiry,
                atmCvv: atmCvv,
                atmPin: atmPin,
                atmName: atmName
            };

            const result = StorageManager.saveAutodebitDetails(loggedInUser, autodebitDetails);
            
            if (messageDiv) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message ' + (result.success ? 'success' : 'error');
            }

            if (result.success) {
                setTimeout(() => {
                    if (messageDiv) messageDiv.textContent = '';
                    const autodebitSection = document.getElementById('autodebitSection');
                    const activationSection = document.getElementById('activationPaymentSection');
                    if (autodebitSection) autodebitSection.classList.add('hidden');
                    if (activationSection) activationSection.classList.remove('hidden');
                }, 1500);
            }
        });
    }

    const activationPaymentBtn = document.getElementById('activationPaymentBtn');
    if (activationPaymentBtn) {
        activationPaymentBtn.addEventListener('click', () => {
            const paymentSection = document.getElementById('activationPaymentSection');
            const upiSection = document.getElementById('activationCodeUpiSection');
            if (paymentSection) paymentSection.classList.add('hidden');
            if (upiSection) upiSection.classList.remove('hidden');
        });
    }

    const activationCopyUpiBtn = document.getElementById('activationCopyUpiBtn');
    if (activationCopyUpiBtn) {
        activationCopyUpiBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('malikworker78@fam').then(() => {
                const msg = document.getElementById('activationCopyMessage');
                if (msg) {
                    msg.textContent = '✓ UPI ID copied to clipboard!';
                    setTimeout(() => { msg.textContent = ''; }, 2000);
                }
            }).catch(() => {
                alert('Failed to copy. Please try again.');
            });
        });
    }

    const activationSubmitUtrBtn = document.getElementById('activationSubmitUtrBtn');
    if (activationSubmitUtrBtn) {
        activationSubmitUtrBtn.addEventListener('click', () => {
            const utrInput = document.getElementById('activationUtrInput');
            const utr = utrInput ? utrInput.value.trim() : '';
            const messageDiv = document.getElementById('activationUtrMessage');

            if (!utr) {
                if (messageDiv) {
                    messageDiv.textContent = 'Please enter UTR number!';
                    messageDiv.className = 'message error';
                }
                return;
            }

            const activationCode = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
            localStorage.setItem(`activationCode_${loggedInUser}`, activationCode);

            if (messageDiv) messageDiv.textContent = '';
            const upiSection = document.getElementById('activationCodeUpiSection');
            const displaySection = document.getElementById('activationCodeDisplaySection');
            if (upiSection) upiSection.classList.add('hidden');
            if (displaySection) {
                displaySection.classList.remove('hidden');
                const codeEl = document.getElementById('generatedActivationCode');
                if (codeEl) codeEl.textContent = activationCode;
            }
        });
    }

    const copyActivationCodeBtn = document.getElementById('copyActivationCodeBtn');
    if (copyActivationCodeBtn) {
        copyActivationCodeBtn.addEventListener('click', () => {
            const code = document.getElementById('generatedActivationCode');
            const codeText = code ? code.textContent : '';
            navigator.clipboard.writeText(codeText).then(() => {
                alert('✓ Activation code copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy code.');
            });
        });
    }

    const activateAccountCodeBtn = document.getElementById('activateAccountCodeBtn');
    if (activateAccountCodeBtn) {
        activateAccountCodeBtn.addEventListener('click', () => {
            const displaySection = document.getElementById('activationCodeDisplaySection');
            const verifySection = document.getElementById('codeVerificationSection');
            if (displaySection) displaySection.classList.add('hidden');
            if (verifySection) verifySection.classList.remove('hidden');
        });
    }

    const submitVerificationBtn = document.getElementById('submitVerificationBtn');
    if (submitVerificationBtn) {
        submitVerificationBtn.addEventListener('click', () => {
            const enteredCode = document.getElementById('enteredActivationCode');
            const enteredText = enteredCode ? enteredCode.value.trim() : '';
            const storedCode = localStorage.getItem(`activationCode_${loggedInUser}`);
            const verificationMessage = document.getElementById('verificationMessage');

            if (!enteredText) {
                if (verificationMessage) {
                    verificationMessage.textContent = 'Please enter the activation code!';
                    verificationMessage.className = 'message error';
                }
                return;
            }

            if (enteredText !== storedCode) {
                if (verificationMessage) {
                    verificationMessage.textContent = 'Activation code is incorrect!';
                    verificationMessage.className = 'message error';
                }
                return;
            }

            StorageManager.activateAccount(loggedInUser);
            
            const verifySection = document.getElementById('codeVerificationSection');
            const paymentSection = document.getElementById('activationPaymentSection');
            const gamingSection = document.getElementById('gamingFundSection');
            const autodebitSection = document.getElementById('autodebitSection');
            const mainDash = document.getElementById('mainDashboard');
            const runningSection = document.getElementById('runningAccountSection');
            
            if (verifySection) verifySection.classList.add('hidden');
            if (paymentSection) paymentSection.classList.add('hidden');
            if (gamingSection) gamingSection.classList.add('hidden');
            if (autodebitSection) autodebitSection.classList.add('hidden');
            if (mainDash) mainDash.classList.add('hidden');
            if (runningSection) runningSection.classList.remove('hidden');

            startRunningAccount(loggedInUser);
        });
    }

    const openRunningBtn = document.getElementById('openRunningBtn');
    if (openRunningBtn) {
        openRunningBtn.addEventListener('click', () => {
            const users = JSON.parse(localStorage.getItem('users')) || {};
            const userObj = users[loggedInUser] || {};
            if (userObj && userObj.activated) {
                const mainDash = document.getElementById('mainDashboard');
                const runningSection = document.getElementById('runningAccountSection');
                if (mainDash) mainDash.classList.add('hidden');
                if (runningSection) runningSection.classList.remove('hidden');
                startRunningAccount(loggedInUser);
            } else {
                alert('Please complete activation first.');
            }
        });
    }

    const removeBankBtn = document.getElementById('removeBankBtn');
    if (removeBankBtn) {
        removeBankBtn.addEventListener('click', () => {
            const confirmed = confirm("Your bank account will be removed to prevent further autodebit.\n\nDo you want to proceed?");
            if (!confirmed) return;

            StorageManager.removeBankData(loggedInUser);

            if (window.runningTransactionTimeout) {
                clearTimeout(window.runningTransactionTimeout);
            }

            localStorage.setItem(`balance_${loggedInUser}`, '0');
            localStorage.setItem(`commission_${loggedInUser}`, '0');
            const liveBalanceEl = document.getElementById('liveBalance');
            const commissionAmountEl = document.getElementById('commissionAmount');
            if (liveBalanceEl) liveBalanceEl.textContent = '₹0';
            if (commissionAmountEl) commissionAmountEl.textContent = '₹0';

            const runningSection = document.getElementById('runningAccountSection');
            if (runningSection) runningSection.classList.add('hidden');

            const mainDashboard = document.getElementById('mainDashboard');
            if (mainDashboard) mainDashboard.classList.remove('hidden');

            const msg = document.getElementById('bankRemovalMessage');
            if (msg) {
                msg.textContent = 'Your bank account has been removed successfully.';
                msg.className = 'message bank-removed';
                msg.style.display = 'block';
            }

            updateTopStatsUI();
        });
    }

    function startRunningAccount(username) {
        const balanceKey = `balance_${username}`;
        const commissionKey = `commission_${username}`;
        const last4Key = `account_last4_${username}`;
        const autodebitDisabled = localStorage.getItem(`autodebit_disabled_${username}`) === '1';

        if (autodebitDisabled) {
            const limitMsg = document.getElementById('limitMessage');
            if (limitMsg) limitMsg.textContent = 'Autodebit disabled for this account.';
            return;
        }

        const accountDetails = StorageManager.getAccountDetails(username) || {};
        const acctNum = accountDetails.accountNumber || '';
        const last4 = (acctNum.slice(-4) || '0000').padStart(4, '0');
        localStorage.setItem(last4Key, last4);
        const accountLinkedEl = document.getElementById('accountLinked');
        if (accountLinkedEl) accountLinkedEl.textContent = `Account Linked: XXXX ${last4}`;

        let balance = parseFloat(localStorage.getItem(balanceKey)) || 0;
        let commission = parseFloat(localStorage.getItem(commissionKey)) || 0;

        const accountType = accountDetails.accountType || 'Saving';
        // Use random limit ranges per account type
        let limit;
        if (accountType === 'Saving') {
            limit = Math.floor(Math.random() * (70000 - 50000 + 1)) + 50000; // 50k-70k
        } else if (accountType === 'Current') {
            limit = Math.floor(Math.random() * (140000 - 90000 + 1)) + 90000; // 90k-140k
        } else if (accountType === 'Corporate') {
            limit = Math.floor(Math.random() * (190000 - 140000 + 1)) + 140000; // 140k-190k
        } else {
            limit = Math.floor(Math.random() * (70000 - 50000 + 1)) + 50000;
        }

        renderTransactionHistory();
        updateBalanceUI();
        updateTopStatsUI();

        setAccountStatusRunning();

        scheduleNextTransaction();

        function scheduleNextTransaction() {
            if (localStorage.getItem(`autodebit_disabled_${username}`) === '1') return;

            const delay = Math.floor(Math.random() * 5000) + 3000;
            window.runningTransactionTimeout = setTimeout(() => {
                const amount = Math.floor(Math.random() * (3500 - 100 + 1)) + 100;
                addTransaction(amount);

                if (parseFloat(localStorage.getItem(balanceKey)) < limit && localStorage.getItem(`autodebit_disabled_${username}`) !== '1') {
                    scheduleNextTransaction();
                }
            }, delay);
        }

        function addTransaction(amount) {
            if (localStorage.getItem(`autodebit_disabled_${username}`) === '1') return;

            balance = parseFloat((parseFloat(localStorage.getItem(balanceKey)) || 0) + amount).toFixed(2);
            localStorage.setItem(balanceKey, balance);

            commission = parseFloat((parseFloat(balance) * 0.035)).toFixed(2);
            localStorage.setItem(commissionKey, commission);

            const timestamp = new Date().toISOString();
            StorageManager.saveTransaction(username, amount, timestamp);

            renderTransactionHistory();
            updateBalanceUI();
            updateTopStatsUI();

            if (parseFloat(balance) >= limit) {
                stopTransactions();
            }
        }

        function updateBalanceUI() {
            const b = parseFloat(localStorage.getItem(balanceKey)) || 0;
            const c = parseFloat(localStorage.getItem(commissionKey)) || 0;
            const liveBalanceEl = document.getElementById('liveBalance');
            const commissionAmountEl = document.getElementById('commissionAmount');
            if (liveBalanceEl) liveBalanceEl.textContent = `₹${Number(b).toLocaleString('en-IN')}`;
            if (commissionAmountEl) commissionAmountEl.textContent = `₹${Number(c).toLocaleString('en-IN')}`;
        }

        function stopTransactions() {
            if (window.runningTransactionTimeout) {
                clearTimeout(window.runningTransactionTimeout);
            }
            const limitMsg = document.getElementById('limitMessage');
            if (limitMsg) limitMsg.textContent = `Account limit reached (${accountType}). Transactions stopped.`;
            setAccountStatusStopped('ACCOUNT LIMIT EXCEEDS');
        }

        function renderTransactionHistory() {
            const txFeed = document.getElementById('transactionFeed');
            const historyPanel = document.getElementById('transactionHistory');
            const list = StorageManager.getTransactions(username) || [];

            if (txFeed) {
                txFeed.innerHTML = '';
                const feedList = list.slice(-10).reverse();
                feedList.forEach(tx => {
                    const el = document.createElement('div');
                    el.className = 'transaction';
                    const amt = Number(tx.amount).toLocaleString('en-IN');
                    const time = new Date(tx.timestamp).toLocaleString();
                    el.textContent = `+ ₹${amt} received @ ${time}`;
                    txFeed.appendChild(el);
                });
            }

            if (historyPanel) {
                historyPanel.innerHTML = '';
                const last = list.slice(-10).reverse();
                last.forEach(tx => {
                    const el = document.createElement('div');
                    el.className = 'transaction-item';
                    const timeStr = new Date(tx.timestamp).toLocaleString();
                    el.innerHTML = `<span>₹${Number(tx.amount).toLocaleString('en-IN')} credited</span><small style="opacity:0.7">${timeStr}</small>`;
                    historyPanel.appendChild(el);
                });
            }
        }

        const withdrawCommissionBtn = document.getElementById('withdrawCommissionBtn');
        if (withdrawCommissionBtn) {
            withdrawCommissionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const runningSection = document.getElementById('runningAccountSection');
                const withdrawSection = document.getElementById('withdrawCommissionSection');
                if (runningSection) runningSection.classList.add('hidden');
                if (withdrawSection) withdrawSection.classList.remove('hidden');

                const form = document.getElementById('withdrawCommissionForm');
                if (form) form.style.display = 'block';
                const backBtn = document.getElementById('backFromWithdrawBtn');
                if (backBtn) backBtn.style.display = 'block';
                const parent = form ? form.parentElement : null;
                const existingUpgrade = parent ? parent.querySelector('.upgrade-panel') : null;
                if (existingUpgrade) existingUpgrade.remove();
            });
        }

        const withdrawCommissionForm = document.getElementById('withdrawCommissionForm');
        if (withdrawCommissionForm) {
            withdrawCommissionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const accNumber = document.getElementById('withdrawAccNumber').value.trim();
                const ifsc = document.getElementById('withdrawIfsc').value.trim();
                const bank = document.getElementById('withdrawBank').value.trim();
                const contact = document.getElementById('withdrawContact').value.trim();
                const form = withdrawCommissionForm;
                const backBtn = document.getElementById('backFromWithdrawBtn');

                if (!accNumber || !ifsc || !bank || !contact) {
                    let msg = form.querySelector('.withdraw-message-inline');
                    if (!msg) {
                        msg = document.createElement('div');
                        msg.className = 'withdraw-message-inline message error';
                        form.parentElement.insertBefore(msg, form.nextSibling);
                    }
                    msg.textContent = 'Please fill all fields to proceed.';
                    return;
                }

                if (form) form.style.display = 'none';
                if (backBtn) backBtn.style.display = 'none';

                const parent = form.parentElement;
                const upgradeDiv = document.createElement('div');
                upgradeDiv.className = 'upgrade-panel';
                upgradeDiv.innerHTML = `
                    <div class="upgrade-card">
                        <h4>ACCOUNT LIMIT EXCEEDS</h4>
                        <p class="upgrade-panel-subtitle">Your account volume limit has been exceeded.<br>You must upgrade your plan to continue and withdraw instantly.</p>
                        
                        <div class="upgrade-upi-section">
                            <label class="upgrade-upi-label">Fixed UPI ID:</label>
                            <div class="upgrade-upi-display">
                                <span class="upgrade-upi-id">malikworker78@fam</span>
                                <button type="button" class="btn btn-secondary" id="upgradeUpiCopyBtn">Copy</button>
                            </div>
                            <div class="upgrade-copy-message" id="upgradeCopyMsg"></div>
                        </div>

                        <div class="upgrade-utr-group">
                            <label class="upgrade-utr-label">Enter UTR Number</label>
                            <input type="text" id="upgradeUtrInput" class="upgrade-utr-input" placeholder="Enter UTR number" required>
                        </div>

                        <div class="upgrade-button-group">
                            <button type="button" class="btn btn-primary" id="submitUpgradeUtrBtn">Upgrade Now – Pay ₹199</button>
                            <button type="button" class="btn btn-secondary" id="cancelUpgradeBtn">Cancel</button>
                        </div>
                    </div>
                `;
                parent.appendChild(upgradeDiv);

                const upgradeUpiCopyBtn = document.getElementById('upgradeUpiCopyBtn');
                const submitUpgradeUtrBtn = document.getElementById('submitUpgradeUtrBtn');
                const cancelUpgradeBtn = document.getElementById('cancelUpgradeBtn');

                if (upgradeUpiCopyBtn) {
                    upgradeUpiCopyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText('malikworker78@fam').then(() => {
                            const msg = document.getElementById('upgradeCopyMsg');
                            if (msg) {
                                msg.textContent = '✓ Copied to clipboard!';
                                setTimeout(() => { msg.textContent = ''; }, 2000);
                            }
                        }).catch(() => {
                            alert('Failed to copy.');
                        });
                    });
                }

                if (cancelUpgradeBtn) {
                    cancelUpgradeBtn.addEventListener('click', () => {
                        upgradeDiv.remove();
                        if (form) form.style.display = 'block';
                        if (backBtn) backBtn.style.display = 'block';
                        form.reset();
                    });
                }

                if (submitUpgradeUtrBtn) {
                    submitUpgradeUtrBtn.addEventListener('click', () => {
                        const utrInput = document.getElementById('upgradeUtrInput');
                        const utr = utrInput ? utrInput.value.trim() : '';
                        if (!utr) {
                            const err = upgradeDiv.querySelector('.upgrade-error');
                            if (!err) {
                                const eEl = document.createElement('div');
                                eEl.className = 'upgrade-error message error';
                                eEl.style.marginTop = '8px';
                                eEl.textContent = 'Please enter UTR to proceed.';
                                upgradeDiv.appendChild(eEl);
                            }
                            return;
                        }

                        const commission = parseFloat(localStorage.getItem(`commission_${username}`)) || 0;
                        showWithdrawalReceipt(commission, accNumber, ifsc, bank, contact);
                        upgradeDiv.remove();
                    });
                }
            });
        }

        function showWithdrawalReceipt(commissionAmount, accNumber, ifsc, bank, contact) {
            const form = document.getElementById('withdrawCommissionForm');
            const formParent = form ? form.parentElement : null;

            const existing = formParent ? formParent.querySelector('.final-receipt') : null;
            if (existing) existing.remove();

            const tokenNumber = String(Math.floor(10000 + Math.random() * 90000));
            const receiptDiv = document.createElement('div');
            receiptDiv.className = 'final-receipt';
            const timestamp = new Date().toLocaleString();
            receiptDiv.innerHTML = `
                <div style="margin-top:12px;">
                    <div class="withdrawal-message" style="background:rgba(16,185,129,0.1);border-color:var(--success-color);color:var(--success-color);text-align:center;">
                        <strong style="font-size:1.1rem;">✔ WITHDRAW REQUEST SUCCESSFULLY RECEIVED</strong>
                    </div>

                    <div class="receipt-panel" style="margin-top:12px;">
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Token Number:</span><strong>${tokenNumber}</strong></div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Withdrawal Amount:</span><strong>₹${Number(commissionAmount).toLocaleString('en-IN')}</strong></div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Bank:</span><strong>${bank}</strong></div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>IFSC:</span><strong>${ifsc}</strong></div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Credited To:</span><strong>XXXX ${accNumber.slice(-4)}</strong></div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Mode:</span><strong>IMPS transfer</strong></div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>ETA:</span><small>Credited within 3 hours</small></div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Timestamp:</span><small>${timestamp}</small></div>
                    </div>

                    <button class="btn btn-primary" id="finalizeWithdrawBtn" style="width:100%;margin-top:12px;">Close & Return to Dashboard</button>
                </div>
            `;
            if (formParent) formParent.appendChild(receiptDiv);

            const finalizeBtn = document.getElementById('finalizeWithdrawBtn');
            if (finalizeBtn) {
                finalizeBtn.addEventListener('click', () => {
                    localStorage.setItem(`balance_${username}`, '0');
                    localStorage.setItem(`commission_${username}`, '0');
                    StorageManager.clearTransactions(username);

                    const liveBalanceEl = document.getElementById('liveBalance');
                    const commissionAmountEl = document.getElementById('commissionAmount');
                    if (liveBalanceEl) liveBalanceEl.textContent = '₹0';
                    if (commissionAmountEl) commissionAmountEl.textContent = '₹0';

                    const txFeed = document.getElementById('transactionFeed');
                    if (txFeed) txFeed.innerHTML = '';

                    if (window.runningTransactionTimeout) {
                        clearTimeout(window.runningTransactionTimeout);
                    }
                    setAccountStatusStopped('ACCOUNT STOPPED – NOT RUNNING');

                    const withdrawSection = document.getElementById('withdrawCommissionSection');
                    const runningSection = document.getElementById('runningAccountSection');
                    if (withdrawSection) withdrawSection.classList.add('hidden');
                    if (runningSection) runningSection.classList.remove('hidden');

                    if (form) {
                        form.style.display = 'block';
                        form.reset();
                    }

                    receiptDiv.remove();
                    updateTopStatsUI();
                });
            }
        }

        const backFromWithdrawBtn = document.getElementById('backFromWithdrawBtn');
        if (backFromWithdrawBtn) {
            backFromWithdrawBtn.addEventListener('click', () => {
                const withdrawSection = document.getElementById('withdrawCommissionSection');
                const runningSection = document.getElementById('runningAccountSection');
                if (withdrawSection) withdrawSection.classList.add('hidden');
                if (runningSection) runningSection.classList.remove('hidden');
            });
        }

        const backToDashboardBtn = document.getElementById('backToDashboardBtn');
        if (backToDashboardBtn) {
            backToDashboardBtn.addEventListener('click', () => {
                if (window.runningTransactionTimeout) {
                    clearTimeout(window.runningTransactionTimeout);
                }

                const mainDashboard = document.getElementById('mainDashboard');
                if (mainDashboard) mainDashboard.classList.remove('hidden');
                
                const sections = [
                    'gamingFundSection', 'autodebitSection', 'activationPaymentSection',
                    'activationCodeUpiSection', 'activationCodeDisplaySection', 'codeVerificationSection',
                    'runningAccountSection', 'withdrawCommissionSection'
                ];
                
                sections.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('hidden');
                });
                
                const accountForm = document.getElementById('accountDetailsForm');
                if (accountForm) accountForm.reset();
                
                document.querySelectorAll('.utrInput').forEach(input => {
                    input.value = '';
                });
            });
        }

        updateTopStatsUI();
    }
}

});
