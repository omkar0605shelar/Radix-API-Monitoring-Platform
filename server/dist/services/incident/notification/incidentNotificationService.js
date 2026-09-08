import { getIO } from '../../../config/socket.js';
export class IncidentNotificationService {
    /**
     * Dispatches notifications across configured delivery channels
     */
    static async notify(payload) {
        const timestamp = new Date().toISOString();
        console.log(`[ALERT NOTIFICATION] [${payload.severity}] ${payload.title} - ${payload.message}`);
        // 1. Socket.io Real-Time UI Broadcast
        try {
            const io = getIO();
            io.emit('incident.notification', {
                ...payload,
                timestamp
            });
        }
        catch (e) {
            // safe
        }
        // 2. Webhook notification (if WEBHOOK_URL env configured)
        if (process.env.INCIDENT_WEBHOOK_URL && typeof globalThis.fetch === 'function') {
            try {
                await globalThis.fetch(process.env.INCIDENT_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: payload.type,
                        incidentId: payload.incidentId,
                        title: payload.title,
                        message: payload.message,
                        severity: payload.severity,
                        timestamp
                    })
                });
            }
            catch (err) {
                console.warn(`[IncidentNotificationService] Webhook dispatch failed: ${err.message}`);
            }
        }
    }
}
