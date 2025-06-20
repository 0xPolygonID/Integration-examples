// Set the base URL for the API request
const baseUrl = `${window.location.origin}${window.location.pathname}`;

// Function to poll status
function pollStatus(requestId) {
  const checkStatus = () => {
    fetch(`${baseUrl}api/status/${requestId}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Status:", data.status);
        if (data.status !== "success") {
          // Continue polling if not successful
          setTimeout(checkStatus, 2000); // Poll every 2 seconds
        } else {
          console.log("Verification completed successfully!");
          if (
            confirm(
              "✅ Verification completed successfully!\nReload the page."
            )
          ) {
            window.location.reload();
          }
        }
      })
      .catch((error) => {
        console.error("Error checking status:", error);
        if (
          confirm(
            "❌ Error occurred during verification.\nWould you like to restart the page to try again?"
          )
        ) {
          window.location.reload();
        }
      });
  };

  checkStatus();
}

// Function to handle the page load event
window.onload = () => {
    const linkButton = document.getElementById('button');

    // Fetch data from the API to generate the universal link
    fetch(`${baseUrl}api/verification-request`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to fetch API data');
            }
        })
        .then(data => {
            // Encode the data in Base64 for the universal link
            const encodedRequest = btoa(JSON.stringify(data));
            linkButton.href = `https://wallet.privado.id/#i_m=${encodedRequest}`;
            linkButton.style.display = 'block'; // Show the universal link button
            
            // Start polling status after successful verification request
            const requestId = data.body.scope[0].id; // Get the proof request ID
            console.log('Starting status polling for request ID:', requestId);
            pollStatus(requestId);
        })
        .catch(error => console.error('Error fetching data from API:', error));
};
