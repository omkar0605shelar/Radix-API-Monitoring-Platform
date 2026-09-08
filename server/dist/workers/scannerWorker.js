// import { getChannel } from '../config/rabbitmq.js';
import prisma from '../config/client.js';
import { getIO } from '../config/socket.js';
import redisClient from '../config/redis.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
const execAsync = promisify(exec);
const findFiles = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'vendor' || file === '.venv')
            continue;
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            findFiles(path.join(dir, file), fileList);
        }
        else if (file.endsWith('.ts') ||
            file.endsWith('.js') ||
            file.endsWith('.php') ||
            file.endsWith('.py') ||
            file.endsWith('.go') ||
            file.endsWith('.java') ||
            file.endsWith('.cs')) {
            fileList.push(path.join(dir, file));
        }
    }
    return fileList;
};
const extractRoutesFromFiles = (files) => {
    const routes = [];
    // 1. Express / Nest / Fastify: app.get('/...', ...), router.post('/...', ...)
    const expressRegex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`](.*?)['"`]/gi;
    // 2. Laravel / PHP: Route::get('path', ...), Route::post('/path', ...)
    const laravelRegex = /Route::(get|post|put|delete|patch)\s*\(\s*['"`](.*?)['"`]/gi;
    // 3. Python FastAPI / Flask: @app.get('/...'), @router.post('/...'), @bp.route('/...', methods=['...'])
    const pythonRegex = /@(?:app|router|bp)\.(get|post|put|delete|patch)\s*\(\s*['"`](.*?)['"`]/gi;
    // 4. Go (Gin / Fiber / Echo / Chi): r.GET("/...", ...), app.Post("/...", ...)
    const goRegex = /(?:r|router|app|api|v1|group)\.(GET|POST|PUT|DELETE|PATCH)\s*\(\s*['"`](.*?)['"`]/gi;
    // 5. Spring Boot / Java: @GetMapping("/..."), @PostMapping("/...")
    const springRegex = /@(Get|Post|Put|Delete|Patch)Mapping\s*\(\s*(?:value\s*=\s*)?['"`](.*?)['"`]/gi;
    // 6. ASP.NET / C#: [HttpGet("...")], [HttpPost("...")]
    const csharpRegex = /\[Http(Get|Post|Put|Delete|Patch)\s*\(\s*['"`](.*?)['"`]\)\]/gi;
    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            let match;
            while ((match = expressRegex.exec(content)) !== null) {
                const p = match[2].startsWith('/') ? match[2] : '/' + match[2];
                routes.push({ method: match[1].toUpperCase(), path: p });
            }
            while ((match = laravelRegex.exec(content)) !== null) {
                const p = match[2].startsWith('/') ? match[2] : '/' + match[2];
                routes.push({ method: match[1].toUpperCase(), path: p });
            }
            while ((match = pythonRegex.exec(content)) !== null) {
                const p = match[2].startsWith('/') ? match[2] : '/' + match[2];
                routes.push({ method: match[1].toUpperCase(), path: p });
            }
            while ((match = goRegex.exec(content)) !== null) {
                const p = match[2].startsWith('/') ? match[2] : '/' + match[2];
                routes.push({ method: match[1].toUpperCase(), path: p });
            }
            while ((match = springRegex.exec(content)) !== null) {
                const p = match[2].startsWith('/') ? match[2] : '/' + match[2];
                routes.push({ method: match[1].toUpperCase(), path: p });
            }
            while ((match = csharpRegex.exec(content)) !== null) {
                const p = match[2].startsWith('/') ? match[2] : '/' + match[2];
                routes.push({ method: match[1].toUpperCase(), path: p });
            }
        }
        catch {
            // Ignore unreadable files
        }
    }
    const deduped = routes.filter((v, i, a) => a.findIndex(t => (t.method === v.method && t.path === v.path)) === i);
    return deduped;
};
export const processScanJob = async (projectId, repositoryUrl) => {
    console.log(`Processing Job for Project ${projectId}: ${repositoryUrl}`);
    const io = getIO();
    const tempDir = path.join(process.cwd(), '.temp', projectId);
    try {
        await prisma.project.update({ where: { id: projectId }, data: { status: 'scanning' } });
        io.to(projectId).emit('status_update', { status: 'scanning', message: 'Scanning started' });
        // 1. Clone Repo
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        await execAsync(`git clone ${repositoryUrl} "${tempDir}" --depth 1`);
        io.to(projectId).emit('status_update', { status: 'processing', message: 'Analyzing code structure...' });
        // 2. Parse Files
        const files = findFiles(tempDir);
        const extractedRoutes = extractRoutesFromFiles(files);
        // 3. Save to DB
        // Clear old endpoints if any for re-scan
        await prisma.endpoint.deleteMany({ where: { project_id: projectId } });
        for (const route of extractedRoutes) {
            const mockRequest = ['POST', 'PUT', 'PATCH'].includes(route.method)
                ? { exampleField: "exampleValue", message: "Auto-generated request schema" }
                : null;
            const mockResponse = {
                success: true,
                message: `Mock response for ${route.method} ${route.path}`
            };
            await prisma.endpoint.create({
                data: {
                    project_id: projectId,
                    method: route.method,
                    path: route.path,
                    request_schema: mockRequest,
                    response_schema: mockResponse
                }
            });
        }
        // 4. Update Status and Clear Cache
        await prisma.project.update({ where: { id: projectId }, data: { status: 'completed' } });
        if (redisClient.isOpen) {
            try {
                await redisClient.del(`endpoints:${projectId}`);
            }
            catch (err) {
                // Silent cleanup: intermittent Redis errors shouldn't crash or worry the user after a successful scan.
            }
        }
        io.to(projectId).emit('status_update', { status: 'completed', message: 'Scanning completed successfully' });
        console.log(`Successfully completed scan for project ${projectId}. Found ${extractedRoutes.length} endpoints.`);
    }
    catch (error) {
        console.error(`Error processing project ${projectId}:`, error);
        await prisma.project.update({ where: { id: projectId }, data: { status: 'failed' } });
        io.to(projectId).emit('status_update', { status: 'failed', message: 'Scanning failed' });
    }
    finally {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
};
export const startWorker = async () => {
    // No longer needed for RabbitMQ, but keeping the export signature to avoid index.ts breakages
    console.log('Main server process now handles scans directly.');
};
