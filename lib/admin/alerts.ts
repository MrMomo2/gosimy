export type AlertLevel = 'info' | 'warning' | 'critical';

export interface AlertPayload {
    title: string;
    message: string;
    level: AlertLevel;
    data?: Record<string, unknown>;
}

/**
 * Sends a critical eCommerce alert to a configured webhook (e.g., Slack, Discord, Teams).
 * Falls back to console.error if not configured, ensuring the main thread never crashes.
 */
export async function sendAdminAlert({ title, message, level, data }: AlertPayload) {
    try {
        const webhookUrl = process.env.ADMIN_WEBHOOK_URL;

        // Always log to console for standard tracking
        const prefix = level === 'critical' ? '🔴 CRITICAL' : level === 'warning' ? '🟠 WARNING' : '🔵 INFO';
        console.log(`[ALERT] ${prefix}: ${title} - ${message}`, data || '');

        if (!webhookUrl) {
            return; // Silently skip if no webhook is configured (good for local dev)
        }

        // Format for Discord/Slack compatibility
        const color = level === 'critical' ? 16711680 : level === 'warning' ? 16753920 : 3447003;

        const payload = {
            // Slack format
            text: `${prefix}: *${title}*\n${message}`,
            // Discord format (rich embed)
            embeds: [{
                title,
                description: message,
                color,
                fields: data ? Object.entries(data).map(([key, value]) => ({
                    name: key,
                    value: String(value).substring(0, 1000), // Prevent overflow
                    inline: true
                })) : [],
                timestamp: new Date().toISOString()
            }]
        };

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error('[admin-alerts] Failed to send webhook:', err));

    } catch (err) {
        // Never let an alert failure crash the actual business logic
        console.error('[admin-alerts] Fatal error in alert script:', err);
    }
}
