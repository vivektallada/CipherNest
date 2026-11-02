// CipherNest - Application Logic

import { encryptData, decryptData } from "./crypto.js";

let currentMode = "encrypt";

// Get HTML elements

const workspace = document.getElementById("workspace");
const fileInput = document.getElementById("fileInput");
const passwordInput = document.getElementById("password");
const processBtn = document.getElementById("processBtn");
const status = document.getElementById("status");
const progressBox = document.getElementById("progressBox");
const progressText = document.getElementById("progressText");

// Password Show / Hide

function togglePasswordVisibility() {

    const button = document.getElementById("togglePassword");

    if (passwordInput.type === "password") {

        passwordInput.type = "text";
        button.textContent = "🙈";
        button.setAttribute("aria-label", "Hide password");

    } else {

        passwordInput.type = "password";
        button.textContent = "👁️";
        button.setAttribute("aria-label", "Show password");
    }
}

// Reset password visibility

function resetPasswordVisibility() {

    passwordInput.type = "password";

    const button = document.getElementById("togglePassword");

    button.textContent = "👁️";
    button.setAttribute("aria-label", "Show password");
}

// Password Strength Checker

function checkPasswordStrength() {

    const password = passwordInput.value;

    const strengthText = document.getElementById("strengthText");
    const strengthTip = document.getElementById("strengthTip");

    const bars = [
        document.getElementById("bar1"),
        document.getElementById("bar2"),
        document.getElementById("bar3"),
        document.getElementById("bar4")
    ];

    const colors = [
        "#ff4d5e",
        "#ff9f43",
        "#ffd166",
        "#16c784"
    ];

    bars.forEach(bar => {
        bar.style.background = "#34445e";
    });

    if (password.length === 0) {

        strengthText.textContent = "Not entered";
        strengthText.style.color = "#aab5c9";

        strengthTip.textContent =
            "Use 12+ characters with uppercase, lowercase, numbers and symbols.";

        return;
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    let level;
    let color;
    let activeBars;

    if (score <= 2) {

        level = "Weak";
        color = colors[0];
        activeBars = 1;

        strengthTip.textContent =
            "Try a longer password with uppercase, numbers and symbols.";

    } else if (score <= 4) {

        level = "Medium";
        color = colors[1];
        activeBars = 2;

        strengthTip.textContent =
            "Good start! Add more characters and variety to improve it.";

    } else {

        level = "Strong";
        color = colors[3];
        activeBars = 4;

        strengthTip.textContent =
            "Good password! Keep it private and never reuse it.";
    }

    strengthText.textContent = level;
    strengthText.style.color = color;

    for (let i = 0; i < activeBars; i++) {
        bars[i].style.background = color;
    }
}

// Display selected file information

function displayFileInfo() {

    const file = fileInput.files[0];
    const fileInfo = document.getElementById("fileInfo");

    if (!file) {
        fileInfo.style.display = "none";
        return;
    }

    document.getElementById("fileName").textContent =
        "📄 " + file.name;

    document.getElementById("fileType").textContent =
        file.type || "Unknown / Not specified";

    let size;

    if (file.size < 1024 * 1024) {

        size = (file.size / 1024).toFixed(2) + " KB";

    } else {

        size = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    }

    document.getElementById("fileSize").textContent = size;

    fileInfo.style.display = "block";
}

// Download processed file

function downloadFile(data, filename) {

    const blob = new Blob([data], {
        type: "application/octet-stream"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Reset status and progress

function resetStatus() {

    status.textContent = "";
    status.className = "";

    progressBox.style.display = "none";
}

// Open Encryption Workspace

function showEncrypt() {

    currentMode = "encrypt";

    workspace.style.display = "flex";

    document.getElementById("modeTitle").textContent =
        "File Encryption";

    processBtn.textContent = "Encrypt File";

    fileInput.value = "";
    passwordInput.value = "";

    document.getElementById("fileInfo").style.display = "none";
    document.getElementById("strengthBox").style.display = "block";

    resetPasswordVisibility();
    checkPasswordStrength();
    resetStatus();

    workspace.scrollIntoView({
        behavior: "smooth"
    });
}

// Open Decryption Workspace

function showDecrypt() {

    currentMode = "decrypt";

    workspace.style.display = "flex";

    document.getElementById("modeTitle").textContent =
        "File Decryption";

    processBtn.textContent = "Decrypt File";

    fileInput.value = "";
    passwordInput.value = "";

    document.getElementById("fileInfo").style.display = "none";
    document.getElementById("strengthBox").style.display = "none";

    resetPasswordVisibility();
    resetStatus();

    workspace.scrollIntoView({
        behavior: "smooth"
    });
}

// Return to Home

function goHome() {

    workspace.style.display = "none";

    fileInput.value = "";
    passwordInput.value = "";

    document.getElementById("fileInfo").style.display = "none";
    document.getElementById("strengthBox").style.display = "block";

    resetPasswordVisibility();
    checkPasswordStrength();
    resetStatus();

    workspace.scrollIntoView({
        behavior: "smooth"
    });
}

// Main Encryption and Decryption Function

async function processFile() {

    const file = fileInput.files[0];
    const password = passwordInput.value;

    if (!file) {

        status.className = "error";
        status.textContent = "Please select a file.";

        return;
    }

    if (!password) {

        status.className = "error";
        status.textContent = "Please enter your password.";

        return;
    }

    if (!window.crypto || !window.crypto.subtle) {

        status.className = "error";

        status.textContent =
            "Secure browser context required. Use Live Server or HTTPS.";

        return;
    }

    processBtn.disabled = true;

    resetStatus();

    progressBox.style.display = "block";

    progressText.textContent =
        currentMode === "encrypt"
            ? "Encrypting your file..."
            : "Decrypting your file...";

    status.textContent =
        "Please wait while your file is being processed.";

    try {

        const data = await file.arrayBuffer();

        if (currentMode === "encrypt") {

            const encrypted = await encryptData(data, password);

            downloadFile(encrypted, file.name + ".enc");

            progressBox.style.display = "none";

            status.className = "success";

            status.textContent =
                "✓ File encrypted successfully! Download completed.";

        } else {

            const decrypted = await decryptData(data, password);

            const outputName = file.name.endsWith(".enc")
                ? file.name.slice(0, -4)
                : file.name + ".dec";

            downloadFile(decrypted, outputName);

            progressBox.style.display = "none";

            status.className = "success";

            status.textContent =
                "✓ File decrypted successfully! Download completed.";
        }

    } catch (error) {

        progressBox.style.display = "none";

        status.className = "error";

        if (currentMode === "decrypt") {

            status.textContent =
                "Decryption failed. Wrong password or damaged file.";

        } else {

            status.textContent =
                "Encryption failed. " + error.message;
        }

    } finally {

        processBtn.disabled = false;
    }
}

// Event Listeners

document.getElementById("encryptBtn").addEventListener(
    "click",
    showEncrypt
);

document.getElementById("decryptBtn").addEventListener(
    "click",
    showDecrypt
);

document.getElementById("backBtn").addEventListener(
    "click",
    goHome
);

document.getElementById("togglePassword").addEventListener(
    "click",
    togglePasswordVisibility
);

processBtn.addEventListener(
    "click",
    processFile
);

fileInput.addEventListener(
    "change",
    displayFileInfo
);

passwordInput.addEventListener(
    "input",
    checkPasswordStrength
);