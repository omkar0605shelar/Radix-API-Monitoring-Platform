import axios from 'axios';
import { TestingRepository } from '../repositories/testingRepository.js';
const testingRepository = new TestingRepository();
export class TestingService {
    async executeRequest(userId, endpointId, method, url, headers, body) {
        const startTime = Date.now();
        let response;
        let status;
        let duration;
        try {
            const axiosRes = await axios({
                method,
                url,
                headers: headers || {},
                data: body,
                validateStatus: () => true, // Catch all statuses to show them to the user
            });
            response = axiosRes.data;
            status = axiosRes.status;
            duration = Date.now() - startTime;
        }
        catch (error) {
            status = error.response ? error.response.status : 500;
            response = error.response ? error.response.data : { message: error.message };
            duration = Date.now() - startTime;
        }
        // Save to PostgreSQL history
        try {
            await testingRepository.saveHistory({
                endpoint_id: endpointId,
                user_id: userId,
                method: method.toUpperCase(),
                url,
                headers: headers || {},
                body: body || {},
                status,
                duration,
                response: response || {}
            });
        }
        catch (saveError) {
            console.error('Failed to save request history:', saveError);
            // Don't fail the request if history save fails
        }
        // Feed telemetry into anomaly detection engine
        try {
            const { AnomalyDetectionService } = await import('./incident/anomaly/anomalyDetectionService.js');
            AnomalyDetectionService.recordTelemetry({
                endpointId,
                projectId: 'global',
                endpointPath: url,
                method,
                duration,
                status,
                isError: status >= 400,
                isTimeout: duration > 5000 || status === 504
            });
        }
        catch (telemetryErr) {
            // safe
        }
        return { status, duration, response };
    }
    async getHistory(endpointId) {
        return testingRepository.getHistoryByEndpoint(endpointId);
    }
}
