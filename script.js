const emailBadge = document.getElementById('email-badge');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');
const deleteBtn = document.getElementById('delete-btn');
const countdownEl = document.getElementById('countdown');
const inboxList = document.getElementById('inbox-list');
const refreshBtn = document.getElementById('refresh-btn');
const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
const preferredNameInput = document.getElementById('preferred-name');

let expirationTime = null;
let countdownInterval = null;
let autoRefreshInterval = null;

let account = null; // To store mail.tm account info
let token = null;

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
}

function startCountdown(durationMs) {
    expirationTime = Date.now() + durationMs;
    if (countdownInterval) clearInterval(countdownInterval);
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

async function fetchDomains() {
    const resp = await fetch('https://api.mail.tm/domains');
    if (resp.ok) {
        const data = await resp.json();
        return data['hydra:member'].map(d => d.domain);
    }
    return ['mail.tm'];
}

function sanitizePreferredName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

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

async function fetchMessages(token) {
    const resp = await fetch('https://api.mail.tm/messages', {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (resp.ok) {
        const data = await resp.json();
        return data['hydra:member'];
    }
    return [];
}

async function generateEmail() {
    const preferredName = preferredNameInput.value.trim();
    try {
        account = await createAccount(preferredName);
        token = await getToken(account.address, account.password);
        emailBadge.textContent = account.address;
        startCountdown(10 * 60 * 1000); // 10 minutes
        fetchInbox();
    } catch (err) {
        alert('Failed to generate email: ' + err.message);
    }
}

async function fetchInbox() {
    if (!token) {
        inboxList.innerHTML = '<p class="text-gray-500">No email generated.</p>';
        return;
    }
    try {
        const messages = await fetchMessages(token);
        renderInbox(messages);
    } catch {
        inboxList.innerHTML = '<p class="text-red-500">Failed to load inbox.</p>';
    }
}

function renderInbox(emails) {
    if (!emails || emails.length === 0) {
        inboxList.innerHTML = '<p class="text-gray-500">No emails yet.</p>';
        return;
    }
    inboxList.innerHTML = '';
    emails.forEach(email => {
        const emailEl = document.createElement('div');
        emailEl.className = 'p-3 bg-gray-700 rounded-md neon-glow cursor-pointer hover:bg-gray-600';
        emailEl.title = email.intro || '';
        emailEl.innerHTML = `
            <div class="font-semibold">${email.from?.address || 'Unknown Sender'}</div>
            <div class="text-sm text-gray-300">${email.subject || '(No Subject)'}</div>
            <div class="text-xs text-gray-400 truncate">${email.intro || ''}</div>
        `;
        inboxList.appendChild(emailEl);
    });
}

function deleteEmail() {
    account = null;
    token = null;
    emailBadge.textContent = 'No email generated';
    inboxList.innerHTML = '<p class="text-gray-500">No emails yet.</p>';
    countdownEl.textContent = '--:--';
    if (countdownInterval) clearInterval(countdownInterval);
}

copyBtn.addEventListener('click', () => {
    if (emailBadge.textContent && emailBadge.textContent !== 'No email generated') {
        navigator.clipboard.writeText(emailBadge.textContent);
        alert('Email copied to clipboard!');
    }
});

generateBtn.addEventListener('click', () => {
    generateEmail();
});

deleteBtn.addEventListener('click', () => {
    deleteEmail();
});

refreshBtn.addEventListener('click', () => {
    fetchInbox();
});

autoRefreshToggle.addEventListener('change', () => {
    if (autoRefreshToggle.checked) {
        autoRefreshInterval = setInterval(fetchInbox, 5000);
    } else {
        clearInterval(autoRefreshInterval);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchInbox();
});
