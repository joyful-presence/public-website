// Joyfully Present — shared front-end config.
// Update this if your API worker's custom domain ever changes.
const API_BASE = "https://api.joyfullypresent.life";

// PayPal client IDs are meant to be public (unlike the secret), safe to keep here.
// Get this from developer.paypal.com > Apps & Credentials.
const PAYPAL_CLIENT_ID = "YOUR_PAYPAL_CLIENT_ID";

function formatMoney(cents) {
  return "$" + (cents / 100).toFixed(2);
}
