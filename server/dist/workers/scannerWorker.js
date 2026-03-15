import { getChannel } from '../config/rabbitmq.js';
import { updateProjectStatus } from '../models/projectModel.js';
import { createEndpoint } from '../models/endpointModel.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
const execAsync = promisify(exec);
const findFiles = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist')
            continue;
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            findFiles(path.join(dir, file), fileList);
        }
        else if (file.endsWith('.ts') || file.endsWith('.js')) {
            fileList.push(path.join(dir, file));
        }
    }
    return fileList;
};
const extractRoutesFromFiles = (files) => {
    const routes = [];
    // Basic Regex to detect app.get('/path') or router.post('/path')
    const routeRegex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`](.*?)['"`]/g;
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = routeRegex.exec(content)) !== null) {
            routes.push({
                method: match[1].toUpperCase(),
                path: match[2],
            });
        }
    }
    // Deduplicate
    return routes.filter((v, i, a) => a.findIndex(t => (t.method === v.method && t.path === v.path)) === i);
};
export const startWorker = async () => {
    try {
        const channel = getChannel();
        if (!channel) {
            console.log('Worker waiting for RabbitMQ channel...');
            setTimeout(startWorker, 5000);
            return;
        }
        console.log('Code Scanner Worker started, waiting for jobs...');
        channel.consume('api_scan_jobs', async (msg) => {
            if (!msg)
                return;
            const { projectId, repositoryUrl } = JSON.parse(msg.content.toString());
            console.log(`Processing Job for Project ${projectId}: ${repositoryUrl}`);
            const tempDir = path.join(process.cwd(), '.temp', projectId);
            try {
                await updateProjectStatus(projectId, 'scanning');
                // 1. Clone Repo
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
                await execAsync(`git clone ${repositoryUrl} "${tempDir}" --depth 1`);
                // 2. Parse Files
                const files = findFiles(tempDir);
                const extractedRoutes = extractRoutesFromFiles(files);
                // 3. Save to DB
                // Generate mock schemas based on the method
                for (const route of extractedRoutes) {
                    const mockRequest = ['POST', 'PUT', 'PATCH'].includes(route.method)
                        ? { exampleField: "exampleValue", message: "Auto-generated request schema" }
                        : null;
                    const mockResponse = {
                        success: true,
                        message: `Mock response for ${route.method} ${route.path}`
                    };
                    await createEndpoint(projectId, route.method, route.path, mockRequest, mockResponse);
                }
                // 4. Update Status
                await updateProjectStatus(projectId, 'completed');
                console.log(`Successfully completed scan for project ${projectId}. Found ${extractedRoutes.length} endpoints.`);
            }
            catch (error) {
                console.error(`Error processing project ${projectId}:`, error);
                await updateProjectStatus(projectId, 'failed');
            }
            finally {
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
                channel.ack(msg);
            }
        });
    }
    catch (error) {
        console.error('Worker failed to start:', error);
    }
};
