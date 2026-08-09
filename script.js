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

    isAccountActivated(username) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        return !!(users[username] && users[username].activated);
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
            localStorage.removeItem(`account_limit_${username}`); // Fix: Clear persisted limit
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

function normalizeButtonsForInteraction() {
    document.querySelectorAll('button').forEach(button => {
        // add explicit type for all non-submit buttons to avoid accidental form submissions
        if (!button.hasAttribute('type')) {
            button.setAttribute('type', 'button');
        }

        // mobile/touch reliability fix (especially for iOS/Android on dynamic layouts)
        button.addEventListener('touchstart', () => {}, { passive: true });
    });
}

// global initialization when DOM is set
normalizeButtonsForInteraction();

function sanitizeUtrInput(input) {
    if (!input) return '';
    const cleaned = input.value.replace(/\D/g, '').slice(0, 12);
    input.value = cleaned;
    return cleaned;
}

const DEMO_UPI_ID_1 = 'eaglepay0@ptyes';
const DEMO_UPI_ID_2 = 'malikpay0@fam';

function setupCopyButton(button, upiId, messageElement) {
    if (!button) return;

    button.addEventListener('click', async () => {
        const message = typeof messageElement === 'string'
            ? document.getElementById(messageElement)
            : messageElement;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(upiId || '');
            } else {
                const temp = document.createElement('textarea');
                temp.value = upiId || '';
                temp.setAttribute('readonly', '');
                temp.style.position = 'fixed';
                temp.style.opacity = '0';
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                document.body.removeChild(temp);
            }

            if (message) {
                message.textContent = '✓ UPI ID copied';
                clearTimeout(message.copyTimer);
                message.copyTimer = setTimeout(() => {
                    message.textContent = '';
                }, 2000);
            }
        } catch (error) {
            if (message) {
                message.textContent = 'Copy failed. Please try again.';
                clearTimeout(message.copyTimer);
                message.copyTimer = setTimeout(() => {
                    message.textContent = '';
                }, 2000);
            }
        }
    });
}

function getNextMidnight() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

let bonusCountdownTimer = null;

function initializeBonusCountdown() {
    const expiryText = document.getElementById('bonusCountdownExpiry');
    const hoursEl = document.getElementById('bonusHours');
    const minutesEl = document.getElementById('bonusMinutes');
    const secondsEl = document.getElementById('bonusSeconds');

    if (!expiryText || !hoursEl || !minutesEl || !secondsEl) return;

    let targetTime = getNextMidnight();

    function updateCountdown() {
        let remainingMs = targetTime.getTime() - Date.now();

        if (remainingMs <= 0) {
            targetTime = getNextMidnight();
            remainingMs = targetTime.getTime() - Date.now();
        }

        const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const day = String(targetTime.getDate()).padStart(2, '0');
        const month = String(targetTime.getMonth() + 1).padStart(2, '0');
        const year = targetTime.getFullYear();
        const currentHour = targetTime.getHours();
        const displayHour = currentHour % 12 === 0 ? 12 : currentHour % 12;
        const amPm = currentHour >= 12 ? 'PM' : 'AM';
        const minuteText = String(targetTime.getMinutes()).padStart(2, '0');

        expiryText.textContent = `Bonus will expire on: ${day}-${month}-${year} ${displayHour}:${minuteText} ${amPm}`;
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    clearInterval(bonusCountdownTimer);
    updateCountdown();
    bonusCountdownTimer = setInterval(updateCountdown, 1000);
}

const workflowSectionIds = [
    'mainDashboard',
    'gamingFundSection',
    'autodebitSection',
    'activationPaymentSection',
    'activationCodeUpiSection',
    'activationCodeDisplaySection',
    'codeVerificationSection',
    'runningAccountSection',
    'withdrawCommissionSection',
    'bonusPageSection',
    'bonusWithdrawSection'
];
const workflowHistory = [];
let bonusPopupTimer = null;

function getBonusStorageKey(key, username) {
    return `${key}_${username || 'default'}`;
}

function isBonusClaimed(username) {
    return localStorage.getItem(getBonusStorageKey('bonusClaimed', username)) === '1';
}

function setBonusState(username, key, value) {
    localStorage.setItem(getBonusStorageKey(key, username), value ? '1' : '0');
}

function getCurrentWorkflowSectionId() {
    return workflowSectionIds.find(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
    }) || 'mainDashboard';
}

function showWorkflowSection(sectionId, pushHistory = true) {
    const currentSectionId = getCurrentWorkflowSectionId();
    if (pushHistory && sectionId && currentSectionId && currentSectionId !== sectionId) {
        workflowHistory.push(currentSectionId);
        if (workflowHistory.length > 20) workflowHistory.shift();
    }

    workflowSectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('hidden', id !== sectionId);
        }
    });

    const transactionHistorySection = document.getElementById('transactionHistorySection');
    if (transactionHistorySection) {
        const shouldHideTxHistory = sectionId === 'bonusPageSection' || sectionId === 'bonusWithdrawSection';
        transactionHistorySection.classList.toggle('hidden', shouldHideTxHistory);
    }

    const backBtn = document.getElementById('dashboardBackBtn');
    if (backBtn) {
        backBtn.style.display = 'inline-flex';
    }
}

function goBackOneStep() {
    const currentSectionId = getCurrentWorkflowSectionId();
    const previousSectionId = workflowHistory.pop();

    if (previousSectionId) {
        showWorkflowSection(previousSectionId, false);
        return;
    }

    if (currentSectionId && currentSectionId !== 'mainDashboard') {
        showWorkflowSection('mainDashboard', false);
        return;
    }
}

function updateBonusBadgeUI(username = StorageManager.getLoggedInUser()) {
    const bonusBadge = document.getElementById('bonusBadge');
    const bonusBox = document.getElementById('bonusBox');
    const bonusOpened = localStorage.getItem(getBonusStorageKey('bonusOpened', username)) === '1';

    if (bonusBox) bonusBox.style.display = 'inline-flex';
    if (bonusBadge) bonusBadge.style.display = bonusOpened ? 'none' : 'inline-flex';
}

function showBonusInlineMessage(message, type = 'error', timeoutMs = 7000) {
    const messageContainer = document.getElementById('bonusMessageContainer');
    if (!messageContainer) return;

    messageContainer.style.display = 'block';
    messageContainer.textContent = message;
    messageContainer.className = `bonus-inline-message ${type}`;

    clearTimeout(bonusPopupTimer);
    bonusPopupTimer = setTimeout(() => {
        messageContainer.style.display = 'none';
        messageContainer.textContent = '';
        messageContainer.className = 'bonus-inline-message';
    }, timeoutMs);
}

function renderBonusPageUI(username = StorageManager.getLoggedInUser()) {
    const bonusSection = document.getElementById('bonusPageSection');
    const title = bonusSection ? bonusSection.querySelector('h3') : null;
    const subtitle = bonusSection ? bonusSection.querySelector('.bonus-page-subtitle') : null;
    const amount = bonusSection ? bonusSection.querySelector('.bonus-amount') : null;
    const claimButton = bonusSection ? bonusSection.querySelector('#claimBonusBtn') : null;
    const messageContainer = document.getElementById('bonusMessageContainer');

    if (!bonusSection) return;

    if (isBonusClaimed(username)) {
        if (title) title.textContent = '✅ CONGRATULATIONS';
        if (subtitle) subtitle.textContent = 'YOU HAVE SUCCESSFULLY CLAIMED YOUR BONUS.';
        if (amount) {
            amount.textContent = '';
            amount.style.display = 'none';
        }
        if (claimButton) {
            claimButton.textContent = 'BONUS CLAIMED';
            claimButton.disabled = true;
            claimButton.classList.remove('btn-primary');
            claimButton.classList.add('btn-secondary');
        }
        if (messageContainer) {
            messageContainer.style.display = 'none';
            messageContainer.textContent = '';
            messageContainer.className = 'bonus-inline-message';
        }
        return;
    }

    if (title) title.textContent = 'CONGRATULATIONS';
    if (subtitle) subtitle.textContent = 'SPECIAL BONUS CREDITED';
    if (amount) {
        amount.textContent = '₹999';
        amount.style.display = 'block';
    }
    if (claimButton) {
        claimButton.textContent = 'CLAIM / WITHDRAW ₹999';
        claimButton.disabled = false;
        claimButton.classList.remove('btn-secondary');
        claimButton.classList.add('btn-primary');
    }
    if (messageContainer) {
        messageContainer.style.display = 'none';
        messageContainer.textContent = '';
        messageContainer.className = 'bonus-inline-message';
    }

    initializeBonusCountdown();
}

function showBonusReceipt(amount, ifsc, bank, holder, username = StorageManager.getLoggedInUser()) {
    const form = document.getElementById('bonusWithdrawForm');
    const formParent = form ? form.parentElement : null;
    const existing = formParent ? formParent.querySelector('.final-receipt') : null;
    if (existing) existing.remove();

    const receiptDiv = document.createElement('div');
    receiptDiv.className = 'final-receipt';
    const timestamp = new Date().toLocaleString();
    receiptDiv.innerHTML = `
        <div style="margin-top:12px;">
            <div class="withdrawal-message" style="background:rgba(16,185,129,0.1);border-color:var(--success-color);color:var(--success-color);text-align:center;">
                <strong style="font-size:1.1rem;">✔ WITHDRAW REQUEST SUCCESSFULLY RECEIVED</strong>
            </div>

            <div class="receipt-panel" style="margin-top:12px;">
                <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Withdrawal Amount:</span><strong>₹${Number(amount).toLocaleString('en-IN')}</strong></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Bank:</span><strong>${bank}</strong></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>IFSC:</span><strong>${ifsc}</strong></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Credited To:</span><strong>${holder}</strong></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Mode:</span><strong>IMPS transfer</strong></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Status:</span><small style="color:var(--success-color);font-weight:700;">Successfully Credited</small></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Timestamp:</span><small>${timestamp}</small></div>
            </div>

            <button type="button" class="btn btn-primary" id="closeBonusReceiptBtn" style="width:100%;margin-top:12px;">Close & Return to Dashboard</button>
        </div>
    `;

    if (formParent) {
        formParent.innerHTML = '';
        formParent.appendChild(receiptDiv);
    }

    const closeBtn = document.getElementById('closeBonusReceiptBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const bonusWithdrawSection = document.getElementById('bonusWithdrawSection');
            const mainDashboard = document.getElementById('mainDashboard');
            const transactionHistorySection = document.getElementById('transactionHistorySection');
            if (bonusWithdrawSection) bonusWithdrawSection.classList.add('hidden');
            if (mainDashboard) mainDashboard.classList.remove('hidden');
            if (transactionHistorySection) transactionHistorySection.classList.remove('hidden');
            if (formParent) formParent.innerHTML = '';
            renderBonusPageUI(username);
        });
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

    const backBtn = document.getElementById('dashboardBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => goBackOneStep());
        backBtn.style.display = 'inline-flex';
    }

    const bonusBox = document.getElementById('bonusBox');
    if (bonusBox) {
        bonusBox.addEventListener('click', () => {
            setBonusState(loggedInUser, 'bonusOpened', true);
            updateBonusBadgeUI(loggedInUser);
            renderBonusPageUI(loggedInUser);
            showWorkflowSection('bonusPageSection');
        });
    }

    const claimBonusBtn = document.getElementById('claimBonusBtn');
    if (claimBonusBtn) {
        claimBonusBtn.addEventListener('click', () => {
            if (isBonusClaimed(loggedInUser)) {
                renderBonusPageUI(loggedInUser);
                return;
            }

            if (!StorageManager.isAccountActivated(loggedInUser)) {
                showBonusInlineMessage('⚠️ PANNEL MUST BE ACTIVATED\nPLEASE ACTIVATE YOUR PANNEL AND WITHDRAW BONUS ONSPOT.');
                return;
            }

            setBonusState(loggedInUser, 'bonusWithdrawStarted', true);
            showWorkflowSection('bonusWithdrawSection');
        });
    }

    const bonusWithdrawForm = document.getElementById('bonusWithdrawForm');
    if (bonusWithdrawForm) {
        bonusWithdrawForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const accNumber = document.getElementById('bonusWithdrawAccNumber').value.trim();
            const ifsc = document.getElementById('bonusWithdrawIfsc').value.trim();
            const holder = document.getElementById('bonusWithdrawHolder').value.trim();
            const bank = document.getElementById('bonusWithdrawBank').value.trim();
            const messageDiv = document.getElementById('bonusWithdrawMessage');

            if (!accNumber || !ifsc || !holder || !bank) {
                if (messageDiv) {
                    messageDiv.textContent = 'Please fill all required fields.';
                    messageDiv.className = 'message error';
                }
                return;
            }

            setBonusState(loggedInUser, 'bonusClaimed', true);
            setBonusState(loggedInUser, 'bonusWithdrawCompleted', true);
            if (messageDiv) {
                messageDiv.textContent = '';
                messageDiv.className = 'message';
            }
            const transactionHistorySection = document.getElementById('transactionHistorySection');
            if (transactionHistorySection) transactionHistorySection.classList.add('hidden');
            renderBonusPageUI(loggedInUser);
            showBonusReceipt(999, ifsc, bank, holder, loggedInUser);
        });
    }

    updateBonusBadgeUI(loggedInUser);
    renderBonusPageUI(loggedInUser);
    showWorkflowSection('mainDashboard', false);

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
            showWorkflowSection('gamingFundSection');

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
                reader.onerror = () => {
                    // Fix: Ensure saveDetails is called even if FileReader fails
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
                        showWorkflowSection('autodebitSection');

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
                    showWorkflowSection('activationPaymentSection');
                }, 1500);
            }
        });
    }

    const activationPaymentBtn = document.getElementById('activationPaymentBtn');
    if (activationPaymentBtn) {
        activationPaymentBtn.addEventListener('click', () => {
            showWorkflowSection('activationCodeUpiSection');
        });
    }

    const activationCopyButtons = document.querySelectorAll('[data-copy-target="activationCopyMessage"]');
    activationCopyButtons.forEach((button) => {
        const upiId = button.getAttribute('data-upi-id');
        const message = document.getElementById(button.getAttribute('data-copy-target'));
        setupCopyButton(button, upiId, message);
    });

    const activationUtrInput = document.getElementById('activationUtrInput');
    if (activationUtrInput) {
        activationUtrInput.addEventListener('input', () => {
            sanitizeUtrInput(activationUtrInput);
        });
    }

    const activationSubmitUtrBtn = document.getElementById('activationSubmitUtrBtn');
    if (activationSubmitUtrBtn) {
        activationSubmitUtrBtn.addEventListener('click', () => {
            const utrInput = document.getElementById('activationUtrInput');
            const utr = utrInput ? sanitizeUtrInput(utrInput) : '';
            const messageDiv = document.getElementById('activationUtrMessage');

            if (!/^\d{12}$/.test(utr)) {
                if (messageDiv) {
                    messageDiv.textContent = 'Please enter a valid 12-digit UTR number.';
                    messageDiv.className = 'message error';
                }
                return;
            }

            const activationCode = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
            localStorage.setItem(`activationCode_${loggedInUser}`, activationCode);

            if (messageDiv) messageDiv.textContent = '';
            showWorkflowSection('activationCodeDisplaySection');
            const displaySection = document.getElementById('activationCodeDisplaySection');
            if (displaySection) {
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
            showWorkflowSection('codeVerificationSection');
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
            showWorkflowSection('runningAccountSection');
            startRunningAccount(loggedInUser);
        });
    }

    const openRunningBtn = document.getElementById('openRunningBtn');
    if (openRunningBtn) {
        openRunningBtn.addEventListener('click', () => {
            const users = JSON.parse(localStorage.getItem('users')) || {};
            const userObj = users[loggedInUser] || {};
            if (userObj && userObj.activated) {
                showWorkflowSection('runningAccountSection');
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

            showWorkflowSection('mainDashboard');

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
        // Fix: Persist account limit in localStorage to prevent regeneration on every call
        const limitKey = `account_limit_${username}`;
        let limit = parseFloat(localStorage.getItem(limitKey));
        if (!limit || isNaN(limit)) {
            if (accountType === 'Saving') {
                limit = Math.floor(Math.random() * (70000 - 50000 + 1)) + 50000; // 50k-70k
            } else if (accountType === 'Current') {
                limit = Math.floor(Math.random() * (140000 - 90000 + 1)) + 90000; // 90k-140k
            } else if (accountType === 'Corporate') {
                limit = Math.floor(Math.random() * (190000 - 140000 + 1)) + 140000; // 140k-190k
            } else {
                limit = Math.floor(Math.random() * (70000 - 50000 + 1)) + 50000;
            }
            localStorage.setItem(limitKey, limit.toString());
        }

        renderTransactionHistory();
        updateBalanceUI();
        updateTopStatsUI();

        setAccountStatusRunning();

        // Fix: Clear any existing timeout to prevent multiple timers
        if (window.runningTransactionTimeout) {
            clearTimeout(window.runningTransactionTimeout);
        }

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
                showWorkflowSection('withdrawCommissionSection');

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
                            <div class="upgrade-upi-row">
                                <label class="upgrade-upi-label">Pay ₹199 via UPI</label>
                                <div class="upgrade-upi-label" style="margin-top: 8px; margin-bottom: 10px; color: var(--text-secondary);">Copy any one UPI ID provided below and pay the ₹199 activation charge.</div>
                                <label class="upgrade-upi-label">UPI ID #1</label>
                                <div class="upgrade-upi-display">
                                    <span class="upgrade-upi-id" data-upi-id="${DEMO_UPI_ID_1}">${DEMO_UPI_ID_1}</span>
                                    <button type="button" class="btn btn-secondary copy-upi-btn" data-upi-id="${DEMO_UPI_ID_1}" data-copy-target="upgradeCopyMsg_1">Copy</button>
                                </div>
                                <div class="upgrade-copy-message" id="upgradeCopyMsg_1"></div>
                            </div>
                            <div class="upgrade-upi-row">
                                <label class="upgrade-upi-label">UPI ID #2</label>
                                <div class="upgrade-upi-display">
                                    <span class="upgrade-upi-id" data-upi-id="${DEMO_UPI_ID_2}">${DEMO_UPI_ID_2}</span>
                                    <button type="button" class="btn btn-secondary copy-upi-btn" data-upi-id="${DEMO_UPI_ID_2}" data-copy-target="upgradeCopyMsg_2">Copy</button>
                                </div>
                                <div class="upgrade-copy-message" id="upgradeCopyMsg_2"></div>
                            </div>
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

                const upgradeCopyButtons = upgradeDiv.querySelectorAll('.copy-upi-btn');
                upgradeCopyButtons.forEach((button) => {
                    const upiId = button.getAttribute('data-upi-id');
                    const message = document.getElementById(button.getAttribute('data-copy-target'));
                    setupCopyButton(button, upiId, message);
                });

                const submitUpgradeUtrBtn = document.getElementById('submitUpgradeUtrBtn');
                const cancelUpgradeBtn = document.getElementById('cancelUpgradeBtn');
                const upgradeUtrInput = document.getElementById('upgradeUtrInput');

                if (upgradeUtrInput) {
                    upgradeUtrInput.addEventListener('input', () => {
                        sanitizeUtrInput(upgradeUtrInput);
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
                        const utr = utrInput ? sanitizeUtrInput(utrInput) : '';
                        if (!/^\d{12}$/.test(utr)) {
                            const err = upgradeDiv.querySelector('.upgrade-error');
                            if (!err) {
                                const eEl = document.createElement('div');
                                eEl.className = 'upgrade-error message error';
                                eEl.style.marginTop = '8px';
                                eEl.textContent = 'Please enter a valid 12-digit UTR number.';
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
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>ETA:</span><small style="color:var(--success-color);font-weight:700;">Successfully Credited</small></div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span>Timestamp:</span><small>${timestamp}</small></div>
                    </div>

                    <button type="button" class="btn btn-primary" id="finalizeWithdrawBtn" style="width:100%;margin-top:12px;">Close & Return to Dashboard</button>
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

                    showWorkflowSection('runningAccountSection');

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
                showWorkflowSection('runningAccountSection');
            });
        }

        const backToDashboardBtn = document.getElementById('backToDashboardBtn');
        if (backToDashboardBtn) {
            backToDashboardBtn.addEventListener('click', () => {
                if (window.runningTransactionTimeout) {
                    clearTimeout(window.runningTransactionTimeout);
                }

                showWorkflowSection('mainDashboard');
                
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