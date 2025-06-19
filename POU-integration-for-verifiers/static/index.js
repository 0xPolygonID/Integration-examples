// Set the base URL for the API request
const baseUrl = `${window.location.origin}${window.location.pathname}`;

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
            linkButton.href = `https://wallet-dev.privado.id/#i_m=${encodedRequest}`;
            linkButton.style.display = 'block'; // Show the universal link button
        })
        .catch(error => console.error('Error fetching data from API:', error));
};