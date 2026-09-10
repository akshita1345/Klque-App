export const ALERT_THRESHOLDS = {
    WARNING: 30, // Percentage
    CRITICAL: 10, // Percentage
    INCIDENT: 0,  // Percentage
};

export const ALERT_RECIPIENTS = [
    process.env.CREDIT_ALERT_RECEIVER
];
