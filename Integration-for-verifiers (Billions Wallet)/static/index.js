// Set the base URL for the API request
const baseUrl = `${window.location.origin}${window.location.pathname}`;

// Store verification data globally for wallet button
let verificationData = null;

// On page load
window.onload = () => {
  const qrCodeEl = document.getElementById('qrcode');

  fetch(`${baseUrl}api/verification-request`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch API data');
      return response.json();
    })
    .then(data => {
      // Store verification data for wallet button
      verificationData = data;
      
      // Create the universal wallet URL using the ver (used for both QR code and button)
      const jsonString = JSON.stringify(data);
      const base64Data = btoa(jsonString);
      const walletUrl = `https://wallet.billions.network/#i_m=${base64Data}`;
      
      // Show and generate QR code
      const qrCodeEl = document.getElementById('qrcode');
      const walletButtonContainer = document.getElementById('walletButtonContainer');
      
      qrCodeEl.style.display = 'block';
      walletButtonContainer.style.display = 'block';
      
      // Check if QRCode library is loaded
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrCodeEl, {
          text: walletUrl,
          width: 256,
          height: 256,
          correctLevel: QRCode.CorrectLevel.Q
        });
      } else {
        console.error('QRCode library not loaded');
        qrCodeEl.innerHTML = '<p>QR Code library failed to load</p>';
        showNotification(
          'error',
          'QR Code Error',
          'Failed to load QR code library. Please refresh the page and try again.',
          true
        );
      }

      // Setup wallet button click handler with universalURL
      setupWalletButton(walletUrl);

      // Extract request ID and start polling
      // The request ID should be in the proof request scope
      const proofRequest = data.body?.scope?.find(s => s.id);
      if (proofRequest && proofRequest.id) {
        console.log(`📋 Found request ID: ${proofRequest.id}`);
        pollStatus(proofRequest.id);
      } else {
        console.error("❌ Could not find request ID in verification request");
        console.log("Available data:", data);
        showNotification(
          'error',
          'Configuration Error',
          'Could not find request ID in verification request. Please contact support.',
          false
        );
      }
    })
    .catch(error => {
      console.error('Error fetching data from API:', error);
      showNotification(
        'error',
        'API Error',
        'Failed to load verification request. Please check your connection and reload the page.',
        true
      );
    });
};


// Custom notification function
function showNotification(type, title, message, showReload = false) {
  const overlay = document.getElementById('notificationOverlay');
  const icon = document.getElementById('notificationIcon');
  const titleEl = document.getElementById('notificationTitle');
  const messageEl = document.getElementById('notificationMessage');
  const reloadBtn = document.getElementById('notificationReload');
  const closeBtn = document.getElementById('notificationClose');

  // Set content
  titleEl.textContent = title;
  messageEl.textContent = message;
  
  // Set icon and style based on type
  if (type === 'success') {
    icon.textContent = '✓';
    icon.className = 'notification-icon success';
  } else if (type === 'error') {
    icon.textContent = '✕';
    icon.className = 'notification-icon error';
  }

  // Show/hide reload button
  if (showReload) {
    reloadBtn.style.display = 'block';
  } else {
    reloadBtn.style.display = 'none';
  }

  // Show modal
  overlay.classList.add('show');

  // Event listeners
  reloadBtn.onclick = () => window.location.reload();
  closeBtn.onclick = () => overlay.classList.remove('show');
  
  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('show');
    }
  };
}

// Function to poll status (optional based on your API)
function pollStatus(requestId) {
  console.log(`🔄 Starting to poll status for request ID: ${requestId}`);
  
  const checkStatus = () => {
    fetch(`${baseUrl}api/status/${requestId}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Status:", data.status);
        if (data.status === "pending") {
          console.log("⏳ Still pending, checking again in 2 seconds...");
          setTimeout(checkStatus, 2000);
        } else if (data.status === "success") {
          console.log("✅ Verification completed successfully!");
          showNotification(
            'success',
            'Verification Complete!',
            'Your identity has been successfully verified using Billions. You can now reload the page to continue.',
            true
          );
        } else if (data.status === "not_found") {
          console.log("❌ Request not found");
          setTimeout(checkStatus, 2000); // Keep trying in case of timing issues
        } else {
          console.log(`❓ Unknown status: ${data.status}`);
          setTimeout(checkStatus, 2000);
        }
      })
      .catch((error) => {
        console.error("Error checking status:", error);
        showNotification(
          'error',
          'Connection Error',
          'Unable to check verification status. Please check your connection and try again.',
          false
        );
        setTimeout(checkStatus, 5000); // Retry after 5 seconds on error
      });
  };

  checkStatus();
}


// Setup wallet button functionality
function setupWalletButton(walletUrl) {
  const walletBtn = document.getElementById('openWalletBtn');
  
  walletBtn.addEventListener('click', () => {
    if (!verificationData) {
      console.error('No verification data available');
      showNotification(
        'error',
        'Data Error',
        'Verification data is not available. Please refresh the page and try again.',
        true
      );
      return;
    }

    try {
      console.log('Opening Billions wallet with URL:', walletUrl);
      
      // Open the wallet URL in a new tab/window
      window.open(walletUrl, '_blank');
      
    } catch (error) {
      console.error('Error creating wallet URL:', error);
      showNotification(
        'error',
        'URL Error',
        'Failed to create wallet URL. Please try scanning the QR code instead.',
        false
      );
    }
  });
}


