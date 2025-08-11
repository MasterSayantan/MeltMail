// DOM Elements
const emailBadge = document.getElementById('email-badge');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');
const deleteBtn = document.getElementById('delete-btn');
const countdownEl = document.getElementById('countdown');
const inboxList = document.getElementById('inbox-list');
const refreshBtn = document.getElementById('refresh-btn');
const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
const preferredNameInput = document.getElementById('preferred-name');
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const mainContent = document.getElementById('main-content');
const emailModal = document.getElementById('email-modal');
const closeModal = document.getElementById('close-modal');
const emailModalFrom = document.getElementById('email-modal-from');
const emailModalDate = document.getElementById('email-modal-date');
const emailModalSubject = document.getElementById('email-modal-subject');
const emailModalBody = document.getElementById('email-modal-body');
const extractOtpBtn = document.getElementById('extract-otp');
const otpContainer = document.getElementById('otp-container');
const otpCode = document.getElementById('otp-code');
const copyOtpBtn = document.getElementById('copy-otp');
const randomNameBtn = document.getElementById('random-name');
const filterButtons = document.querySelectorAll('.filter-btn');

// State variables
let account = null;
let token = null;
let expirationTime = null;
let countdownInterval = null;
let autoRefreshInterval = null;
let currentEmailId = null;
let currentFilter = 'all';

// Simulate loading
function simulateLoading() {
    // Create comets
    createComets(3);
    
    let width = 0;
    const interval = setInterval(() => {
        width += Math.random() * 10;
        loadingBar.style.width = `${Math.min(width, 100)}%`;
        
        if (width >= 100) {
            clearInterval(interval);
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                mainContent.style.display = 'block';
            }, 500);
        }
    }, 100);
}

// Create comet animations
function createComets(count) {
    for (let i = 0; i < count; i++) {
        const comet = document.createElement('div');
        comet.className = 'comet';
        comet.style.top = `${Math.random() * 100}%`;
        comet.style.left = `${Math.random() * 100}%`;
        comet.style.animationDelay = `${Math.random() * 20}s`;
        loadingScreen.appendChild(comet);
    }
}

// Update countdown timer
function updateCountdown() {
    if (!expirationTime) {
        countdownEl.textContent = '--:--';
        return;
    }
    
    const now = Date.now();
    const diff = expirationTime - now;
    
    if (diff <= 0) {
        countdownEl.textContent = 'Expired';
        clearInterval(countdownInterval);
        return;
    }
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    countdownEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color when less than 2 minutes remain
    if (minutes < 2) {
        countdownEl.classList.add('text-red-400', 'animate-pulse');
        countdownEl.classList.remove('text-gray-400');
    } else {
        countdownEl.classList.remove('text-red-400', 'animate-pulse');
        countdownEl.classList.add('text-gray-400');
    }
}

// Start countdown
function startCountdown(durationMs) {
    expirationTime = Date.now() + durationMs;
    if (countdownInterval) clearInterval(countdownInterval);
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// Fetch available domains
async function fetchDomains() {
    try {
        const resp = await fetch('https://api.mail.tm/domains');
        if (resp.ok) {
            const data = await resp.json();
            return data['hydra:member'].map(d => d.domain);
        }
        return ['mail.tm'];
    } catch (error) {
        console.error('Error fetching domains:', error);
        return ['mail.tm'];
    }
}

// Sanitize preferred name
function sanitizePreferredName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Generate random name
function generateRandomName() {
    const adjectives = ['quick', 'smart', 'fast', 'cool', 'mega', 'super', 'ultra', 'hyper'];
    const nouns = ['fox', 'wolf', 'bear', 'eagle', 'hawk', 'lion', 'tiger', 'dragon'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `${randomAdjective}${randomNoun}${randomNum}`;
}

// Create temp email account
async function createAccount(preferredName) {
    const domains = await fetchDomains();
    const domain = domains.length > 0 ? domains[0] : 'mail.tm';
    const sanitized = sanitizePreferredName(preferredName) || Math.random().toString(36).substring(2, 10);
    const suffix = Math.floor(Math.random() * 9999) + 1;
    const address = `${sanitized}${suffix}@${domain}`;
    const password = Math.random().toString(36).substring(2, 14);

    const payload = {
        address,
        password
    };

    const resp = await fetch('https://api.mail.tm/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (resp.status === 201) {
        return { address, password };
    } else {
        throw new Error('Failed to create account');
    }
}

// Get authentication token
async function getToken(address, password) {
    const payload = { address, password };
    const resp = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (resp.ok) {
        const data = await resp.json();
        return data.token;
    }
    throw new Error('Failed to get token');
}

// Fetch messages from inbox
async function fetchMessages(token) {
    try {
        const resp = await fetch('https://api.mail.tm/messages', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (resp.ok) {
            const data = await resp.json();
            return data['hydra:member'];
        }
        return [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

// Generate new temp email
async function generateEmail() {
    const preferredName = preferredNameInput.value.trim();
    
    // Add loading state to button
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Generating...';
    generateBtn.disabled = true;
    
    try {
        account = await createAccount(preferredName);
        token = await getToken(account.address, account.password);
        emailBadge.innerHTML = `<i class="fas fa-envelope mr-2 text-green-400"></i><span>${account.address}</span>`;
        startCountdown(10 * 60 * 1000); // 10 minutes
        
        // Add pulse effect to indicate new email
        emailBadge.classList.add('animate__animated', 'animate__pulse');
        setTimeout(() => {
            emailBadge.classList.remove('animate__animated', 'animate__pulse');
        }, 1000);
        
        await fetchInbox();
        showNotification('New temporary email created!', 'success');
    } catch (err) {
        showNotification(`Failed to generate email: ${err.message}`, 'error');
    } finally {
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// Fetch single email by ID
async function fetchEmailById(id) {
    if (!token) return null;
    
    try {
        const resp = await fetch(`https://api.mail.tm/messages/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (resp.ok) {
            return await resp.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching email:', error);
        return null;
    }
}

// Categorize email using simple AI pattern matching
function categorizeEmail(email) {
    const subject = email.subject || '';
    const text = email.text || '';
    const from = email.from?.address || '';
    
    // Check for OTP codes
    const otpPattern = /\b\d{4,8}\b/g;
    if (otpPattern.test(text) && (subject.toLowerCase().includes('code') || subject.toLowerCase().includes('otp'))) {
        return 'otp';
    }
    
    // Check for notifications
    if (from.includes('noreply') || from.includes('notification') || subject.toLowerCase().includes('notification')) {
        return 'notifications';
    }
    
    // Check for updates
    if (subject.toLowerCase().includes('update') || subject.toLowerCase().includes('newsletter')) {
        return 'updates';
    }
    
    return 'other';
}

// Function to get email preview text
function getEmailPreview(email) {
    const text = email.text || email.html || '';
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    // Get first 100 characters
    return cleanText.substring(0, 100) + (cleanText.length > 100 ? '...' : '');
}

// Render inbox with emails
function renderInbox(emails) {
    if (!emails || emails.length === 0) {
        inboxList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-envelope-open-text text-4xl mb-3"></i>
                <p>No emails yet</p>
                <p class="text-sm mt-1">Created by <span class="text-green-400 creator-name">Sayantan Saha</span></p>
            </div>
        `;
        return;
    }
    
    // Add AI categorization to emails
    emails.forEach(email => {
        email.category = categorizeEmail(email);
        email.preview = getEmailPreview(email);
    });
    
    // Filter emails based on current filter
    const filteredEmails = currentFilter === 'all' 
        ? emails 
        : emails.filter(email => email.category === currentFilter);
    
    if (filteredEmails.length === 0) {
        inboxList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-filter text-4xl mb-3"></i>
                <p>No emails in this category</p>
            </div>
        `;
        return;
    }
    
    inboxList.innerHTML = '';
    filteredEmails.forEach(email => {
        const emailEl = document.createElement('div');
        emailEl.className = 'email-item p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 mb-2';
        emailEl.dataset.id = email.id;
        emailEl.dataset.category = email.category;
        
        // Add icon based on category
        let icon = 'fa-envelope';
        let iconColor = 'text-gray-400';
        
        if (email.category === 'otp') {
            icon = 'fa-shield-alt';
            iconColor = 'text-blue-400';
        } else if (email.category === 'notifications') {
            icon = 'fa-bell';
            iconColor = 'text-yellow-400';
        } else if (email.category === 'updates') {
            icon = 'fa-sync-alt';
            iconColor = 'text-purple-400';
        }
        
        emailEl.innerHTML = `
            <div class="email-header" onclick="toggleEmailExpand('${email.id}')">
                <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center">
                            <i class="fas ${icon} ${iconColor} mr-2"></i>
                            <div class="font-semibold truncate">${email.from?.name || email.from?.address || 'Unknown Sender'}</div>
                        </div>
                        <div class="text-sm text-gray-300 truncate mt-1">${email.subject || '(No Subject)'}</div>
                        <div class="text-xs text-gray-400 mt-1 flex items-center">
                            <i class="far fa-clock mr-1"></i>
                            ${new Date(email.createdAt).toLocaleString()}
                        </div>
                    </div>
                    ${email.isSeen ? '' : '<span class="ml-2 w-2 h-2 bg-green-400 rounded-full"></span>'}
                </div>
                <div class="email-preview mt-2 text-sm text-gray-300 line-clamp-2" id="preview-${email.id}">
                    ${email.preview}
                </div>
            </div>
            <div class="email-full-content hidden mt-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30" id="full-${email.id}"></div>
            <div class="flex justify-end mt-2 space-x-2">
                <button class="text-xs text-gray-400 hover:text-white" onclick="event.stopPropagation();openEmailModal('${email.id}')">
                    <i class="fas fa-expand mr-1"></i> Open Full
                </button>
            </div>
        `;
        
        inboxList.appendChild(emailEl);
    });
}

// Toggle email expand/collapse
function toggleEmailExpand(emailId) {
    const preview = document.getElementById(`preview-${emailId}`);
    const fullContent = document.getElementById(`full-${emailId}`);
    
    if (fullContent.classList.contains('hidden')) {
        // Load full content if not already loaded
        if (fullContent.innerHTML === '') {
            fetchEmailById(emailId).then(email => {
                let emailBody = email.text || email.html || 'No content available';
                if (email.html) {
                    emailBody = email.html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                } else {
                    emailBody = `<pre class="whitespace-pre-wrap font-sans">${emailBody}</pre>`;
                }
                fullContent.innerHTML = emailBody;
            });
        }
        
        preview.classList.add('hidden');
        fullContent.classList.remove('hidden');
    } else {
        preview.classList.remove('hidden');
        fullContent.classList.add('hidden');
    }
}

// Open email in modal
async function openEmailModal(emailId) {
    currentEmailId = emailId;
    const email = await fetchEmailById(emailId);
    
    if (!email) {
        showNotification('Failed to load email', 'error');
        return;
    }
    
    // Update modal content
    emailModalFrom.textContent = `From: ${email.from?.name || email.from?.address || 'Unknown'}`;
    emailModalDate.textContent = `Date: ${new Date(email.createdAt).toLocaleString()}`;
    emailModalSubject.textContent = email.subject || '(No Subject)';
    
    // Process email body (simple HTML/text handling)
    let emailBody = email.text || email.html || 'No content available';
    if (email.html) {
        emailBody = email.html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } else {
        emailBody = `<pre class="whitespace-pre-wrap font-sans">${emailBody}</pre>`;
    }
    
    emailModalBody.innerHTML = emailBody;
    otpContainer.classList.add('hidden');
    copyOtpBtn.classList.add('hidden');
    
    // Show modal
    emailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Auto-extract OTP if it's an OTP email
    if (categorizeEmail(email) === 'otp') {
        setTimeout(() => extractOTP(), 500);
    }
}

// Extract OTP from email
function extractOTP() {
    const emailText = emailModalBody.textContent;
    const otpPattern = /\b\d{4,8}\b/g;
    const otpMatches = emailText.match(otpPattern);
    
    if (otpMatches && otpMatches.length > 0) {
        // Find the most likely OTP (usually the first match in OTP emails)
        const likelyOTP = otpMatches[0];
        otpCode.textContent = likelyOTP;
        otpContainer.classList.remove('hidden');
        copyOtpBtn.classList.remove('hidden');
        
        // Add event listener to copy OTP button
        copyOtpBtn.onclick = () => {
            navigator.clipboard.writeText(likelyOTP)
                .then(() => showNotification('OTP copied to clipboard!', 'success'))
                .catch(() => showNotification('Failed to copy OTP', 'error'));
        };
        
        return true;
    }
    
    return false;
}

// Show notification
function showNotification(message, type = 'info') {
    const colors = {
        info: 'bg-blue-600',
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg animate__animated animate__fadeInRight ${colors[type]}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('animate__fadeOutRight');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Delete current email
function deleteEmail() {
    account = null;
    token = null;
    currentEmailId = null;
    emailBadge.innerHTML = '<i class="fas fa-envelope mr-2"></i><span>No email generated</span>';
    inboxList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
            <i class="fas fa-envelope-open-text text-4xl mb-3"></i>
            <p>No emails yet</p>
            <p class="text-sm mt-1">Created by <span class="text-green-400 creator-name">Sayantan Saha</span></p>
        </div>
    `;
    countdownEl.textContent = '--:--';
    if (countdownInterval) clearInterval(countdownInterval);
    
    showNotification('Temporary email deleted', 'info');
}

// Fetch inbox
async function fetchInbox() {
    if (!token) {
        inboxList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-envelope-open-text text-4xl mb-3"></i>
                <p>No email generated</p>
                <p class="text-sm mt-1">Created by <span class="text-green-400 creator-name">Sayantan Saha</span></p>
            </div>
        `;
        return;
    }
    
    // Add loading state to refresh button
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    refreshBtn.disabled = true;
    
    try {
        const messages = await fetchMessages(token);
        renderInbox(messages);
    } catch (error) {
        inboxList.innerHTML = `
            <div class="text-center py-8 text-red-400">
                <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                <p>Failed to load inbox</p>
            </div>
        `;
    } finally {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshBtn.disabled = false;
    }
}

// Event Listeners
copyBtn.addEventListener('click', () => {
    if (account?.address) {
        navigator.clipboard.writeText(account.address)
            .then(() => showNotification('Email copied to clipboard!', 'success'))
            .catch(() => showNotification('Failed to copy email', 'error'));
    }
});

generateBtn.addEventListener('click', generateEmail);
deleteBtn.addEventListener('click', deleteEmail);
refreshBtn.addEventListener('click', fetchInbox);

autoRefreshToggle.addEventListener('change', () => {
    if (autoRefreshToggle.checked) {
        autoRefreshInterval = setInterval(fetchInbox, 10000); // 10 seconds
        showNotification('Auto-refresh enabled', 'info');
    } else {
        clearInterval(autoRefreshInterval);
        showNotification('Auto-refresh disabled', 'info');
    }
});

closeModal.addEventListener('click', () => {
    emailModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
});

extractOtpBtn.addEventListener('click', () => {
    if (extractOTP()) {
        showNotification('OTP extracted from email', 'success');
    } else {
        showNotification('No OTP code found in this email', 'info');
    }
});

randomNameBtn.addEventListener('click', () => {
    preferredNameInput.value = generateRandomName();
    showNotification('Random name generated', 'info');
});

// Email badge click to copy
emailBadge.addEventListener('click', () => {
    if (account?.address) {
        navigator.clipboard.writeText(account.address)
            .then(() => showNotification('Email copied to clipboard!', 'success'))
            .catch(() => showNotification('Failed to copy email', 'error'));
    }
});

// Filter button clicks
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        fetchInbox();
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    simulateLoading();
    
    // Check for preferred name in localStorage
    const savedName = localStorage.getItem('meltmail_preferred_name');
    if (savedName) {
        preferredNameInput.value = savedName;
    }
    
    // Save preferred name when changed
    preferredNameInput.addEventListener('change', () => {
        localStorage.setItem('meltmail_preferred_name', preferredNameInput.value);
    });
});

// Make functions available globally for inline event handlers
window.toggleEmailExpand = toggleEmailExpand;
window.openEmailModal = openEmailModal;