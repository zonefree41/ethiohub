export function checkSpamSubmission(fields = {}) {
  const blockedPhrases = [
    "your website is hacked",
    "hacked",
    "test@gmail.com",
    "viagra",
    "casino",
    "crypto giveaway",
    "free money",
  ];

  const spamText = Object.values(fields)
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "object" && value !== null) {
        return Object.values(value);
      }
      return value;
    })
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (blockedPhrases.some((phrase) => spamText.includes(phrase))) {
    return "Submission rejected as spam.";
  }

  const urlCount = (spamText.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    return "Too many links. Submission rejected.";
  }

  if (/(.)\1{8,}/.test(spamText)) {
    return "Submission contains too many repeated characters.";
  }

  // Reject titles that are too short
if (fields.title && String(fields.title).trim().length < 3) {
  return "Business name is too short.";
}

// Reject phone numbers that are too short
if (fields.phone) {
  const digits = String(fields.phone).replace(/\D/g, "");

  if (digits.length < 7) {
    return "Please enter a valid phone number.";
  }
}

// Reject extremely long submissions
if (spamText.length > 5000) {
  return "Submission is too large.";
}

  return null;
}