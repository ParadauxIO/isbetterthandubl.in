import {format} from "date-fns";
import path from "path";
import fs from "fs";

export const logMiddleware = (logsDir) => (req, res, next) => {
    // Generate the current date in YYYY-MM-DD format for the log filename
    const today = format(new Date(), "yyyy-MM-dd");
    const logFilePath = path.join(logsDir, `${today}.log`);

    let ip = req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress;

    // If X-Forwarded-For contains multiple IPs, get the first one (client's IP)
    if (ip && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }

    // Get the user agent
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Create a JSON log entry with timestamp, IP, user agent, and requested URL
    const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    const logData = {
        timestamp,
        ip,
        userAgent,
        url: req.originalUrl,
        method: req.method,
        subdomain: req.hostname.split('.')[0]
    };

    // Convert to JSON Line format (single line JSON) with newline at the end
    const jsonLogEntry = JSON.stringify(logData) + '\n';

    // Append to the log file
    fs.appendFile(logFilePath, jsonLogEntry, (err) => {
        if (err) {
            console.error("Error writing to log file:", err);
        }
    });
    console.log(`[${timestamp}] ${ip} ${req.method} ${req.originalUrl} UA:${userAgent} Subdomain:${logData.subdomain}`);

    next();
}