// Joyfully Present — shared front-end config.
// Update this if your API worker's custom domain ever changes.
const API_BASE = "https://api.joyfullypresent.life";

// PayPal client IDs are meant to be public (unlike the secret), safe to keep here.
// Get this from developer.paypal.com > Apps & Credentials.
const PAYPAL_CLIENT_ID = "YOUR_PAYPAL_CLIENT_ID";

function formatMoney(cents) {
  return "$" + (cents / 100).toFixed(2);
}

// Renders an ISO timestamp in the VIEWER's own device timezone (never a
// hardcoded business timezone), with the zone abbreviation always shown so
// it's never mistaken for a different zone.
function formatLocalDateTime(isoString, opts) {
  const date = new Date(isoString);
  const options = {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
    timeZoneName: "short",
  };
  if (!opts || opts.weekday !== false) options.weekday = "short";
  return date.toLocaleString("en-US", options);
}
