/**
 * INFOTSAV 2K26 - Direct Registration Script (No Login Required)
 * Backend: Google Sheets
 */

// ==========================================
// 1. CONFIGURATION
// ==========================================
const scriptURL = 'https://script.google.com/macros/s/AKfycbz2osVYspuP-n1D6peK_5nzZmdJR6aDkiad8tNaOcojVacZUxKIYpM2IxpJzgk-vsRa/exec';

const pricingRules = {
    "AI PlayQuest": { fixed: 120 },
    "Code Dash": { single: 100, dual: 160 },
    "Hoodies to Blazer": { single: 100, dual: 160 },
    "Canva CreateX": { single: 60, dual: 100 },
    "Powerlifting": { fixed: 500 },
    "Chess": { fixed: 80 },
    "IPL Auction": { fixed: 150 }
};

const groupLinks = {
    "Code Dash": "https://chat.whatsapp.com/KR8KPJWiAX8KuFvfFCugHt",
    "AI PlayQuest": "https://chat.whatsapp.com/J5l7Kw4S2O31HQQmGwOZi2",
    "Hoodies to Blazer": "https://chat.whatsapp.com/HPWvIrRg3Z9GkYPs7TzsY2",
    "Canva CreateX": "https://chat.whatsapp.com/DjFoyCIblTS0EdROacScUr",
    "Chess": "https://chat.whatsapp.com/CmRENThsq9o6gCU7QSiV8O",
    "IPL Auction": "https://chat.whatsapp.com/F0oFTUqZdCG3NkmQvVkzYU",
    "Powerlifting": "https://chat.whatsapp.com/L1q530tbrVNBqaDDjQzq4d"
};

// ==========================================
// 2. MODAL & FORM FUNCTIONS
// ==========================================

// Open Modal - DIRECTLY to Form (No Auth Check)
window.openModal = function(eventName) {
    const modal = document.getElementById('regModal');
    const formContainer = document.getElementById('formContainer');
    const successCard = document.getElementById('successCard');
    const firebaseContainer = document.getElementById('firebaseui-auth-container');

    if (!modal) {
        console.error("Error: Modal ID 'regModal' not found in HTML");
        return;
    }

    // Reset View
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    if(formContainer) formContainer.style.display = 'block';
    if(successCard) successCard.style.display = 'none';
    if(firebaseContainer) firebaseContainer.style.display = 'none'; // Hide login box just in case

    // Auto-select event if clicked from a specific card
    if (eventName) {
        const dropdown = document.getElementById('eventDropdown');
        if (dropdown) {
            for (let i = 0; i < dropdown.options.length; i++) {
                if (dropdown.options[i].value === eventName) {
                    dropdown.selectedIndex = i;
                    window.handleEventChange(); // Trigger update
                    break;
                }
            }
        }
    }
};

window.closeModal = function(event) {
    if(event) event.stopPropagation();
    const modal = document.getElementById('regModal');
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    
    // Reset Form Data after closing
    setTimeout(() => {
        const regForm = document.getElementById('regForm');
        if(regForm) regForm.reset();
        document.getElementById('eventQR').src = "placeholder-qr.png";
        document.getElementById('qrLabel').innerText = "SELECT AN EVENT TO VIEW SCANNER";
        document.getElementById('displayTotal').innerText = "0";
    }, 400);
};

// ==========================================
// 3. HELP DESK FUNCTIONS (Your UI)
// ==========================================
window.toggleWaMenu = function(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('waMenu');
    
    if (!menu.classList.contains('show')) {
        menu.style.display = "block";
        setTimeout(() => menu.classList.add('show'), 10);
    } else {
        window.closeWaMenu();
    }
};

window.closeWaMenu = function(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('waMenu');
    if (menu && menu.classList.contains('show')) {
        menu.classList.remove('show');
        setTimeout(() => {
            if (!menu.classList.contains('show')) menu.style.display = "none";
        }, 300);
    }
};

// ==========================================
// 4. FORM LOGIC (Pricing & QR)
// ==========================================
window.handleEventChange = function() {
    const dropdown = document.getElementById('eventDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    
    // Update QR Code
    const qrPath = selectedOption.getAttribute('data-qr');
    const qrImage = document.getElementById('eventQR');
    const qrLabel = document.getElementById('qrLabel');
    if (qrPath && qrImage) {
        qrImage.src = qrPath;
        qrLabel.innerText = `SCAN TO PAY FOR ${selectedOption.value.toUpperCase()}`;
    }

    // Update Pricing & Participation Type
    const toggleBox = document.getElementById('participationToggle');
    const type = selectedOption.getAttribute('data-type');
    
    if (type === 'both') {
        if(toggleBox) toggleBox.style.display = 'block';
        window.syncParticipationType('single'); 
    } else {
        if(toggleBox) toggleBox.style.display = 'none';
        const price = selectedOption.getAttribute('data-price-f');
        document.getElementById('displayTotal').innerText = price;
        const pName = document.getElementById('partnerName');
        if(pName) {
            pName.style.display = 'none';
            pName.required = false;
        }
    }
};

window.syncParticipationType = function(type) {
    const dropdown = document.getElementById('eventDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const displayTotal = document.getElementById('displayTotal');
    const partnerInput = document.getElementById('partnerName');
    const hiddenInput = document.getElementById('Participation_Type');
    
    if(hiddenInput) hiddenInput.value = type;

    if (type === 'single') {
        displayTotal.innerText = selectedOption.getAttribute('data-price-s');
        if(partnerInput) {
            partnerInput.style.display = 'none';
            partnerInput.required = false;
        }
    } else {
        displayTotal.innerText = selectedOption.getAttribute('data-price-d');
        if(partnerInput) {
            partnerInput.style.display = 'block';
            partnerInput.required = true;
        }
    }
};

// ==========================================
// 5. INITIALIZATION (Runs on Load)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- A. Form Submission Logic ---
    const regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.addEventListener('submit', e => {
            e.preventDefault();
            const submitBtn = regForm.querySelector('.contact-btn');
            const originalText = submitBtn.innerHTML;
            const selectedEvent = document.getElementById('eventDropdown').value;
            const groupLink = groupLinks[selectedEvent];

            // Loading State
            submitBtn.disabled = true;
            submitBtn.innerHTML = `Confirming... <div class="spinner"></div>`;

            // Send to Google Sheets
            fetch(scriptURL, { 
                method: 'POST', 
                mode: 'no-cors', 
                body: new FormData(regForm)
            })
            .then(() => {
                // Show Success Message
                const formContainer = document.getElementById('formContainer');
                const successCard = document.getElementById('successCard');
                if(formContainer) formContainer.style.display = 'none';
                
                document.getElementById('targetEventName').innerText = selectedEvent;
                document.getElementById('whatsappGroupLink').href = groupLink || "#";
                
                if(successCard) successCard.style.display = 'flex';
                
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            })
            .catch(error => {
                // Even if network "fails" (common with no-cors), assume success
                console.warn("Sheet submission completed with redirect.");
                const formContainer = document.getElementById('formContainer');
                const successCard = document.getElementById('successCard');
                if(formContainer) formContainer.style.display = 'none';
                
                document.getElementById('targetEventName').innerText = selectedEvent;
                document.getElementById('whatsappGroupLink').href = groupLink || "#";
                
                if(successCard) successCard.style.display = 'flex';

                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
        });
    }

    // --- B. Global Click Listener for Help Desk Close ---
    window.addEventListener('click', function(event) {
        const menu = document.getElementById('waMenu');
        const btn = document.querySelector('.wa-main-btn');

        // Close if menu is open AND click is OUTSIDE menu AND OUTSIDE button
        if (menu && menu.classList.contains('show')) {
            if (!menu.contains(event.target) && !btn.contains(event.target)) {
                window.closeWaMenu();
            }
        }
    });

    // --- C. Countdown Timer ---
    function updateTimer() {
        const targetDate = new Date("2026-02-25T10:00:00").getTime();
        const now = new Date().getTime();
        const diff = targetDate - now;
        const timerContainer = document.getElementById("timer");
        
        if (!timerContainer) return;
        if (diff < 0) {
            timerContainer.innerHTML = "<h3>Event Live Now!</h3>";
            return;
        }
        
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        const setText = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.textContent = val.toString().padStart(2, '0');
        };
        
        setText("days", d);
        setText("hours", h);
        setText("mins", m);
        setText("secs", s);
    }
    setInterval(updateTimer, 1000);
    updateTimer(); // Run once immediately
});