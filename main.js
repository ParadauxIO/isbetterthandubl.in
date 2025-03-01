import 'dotenv/config';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import fs from "fs";
import { format } from "date-fns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const environment = process.env.NODE_ENV;

const app = express();

// Sets the rendering engine and path to views.
app.engine(".html", ejs.__express);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "html");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Logging middleware
app.use((req, res, next) => {
    // Generate the current date in YYYY-MM-DD format for the log filename
    const today = format(new Date(), "yyyy-MM-dd");
    const logFilePath = path.join(logsDir, `${today}.log`);

    // Get the client IP address
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

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

    next();
});

// Extracts subdomain and appends it to the request context.
app.use((req, res, next) => {
    const parts = req.hostname.split('.');
    req.subdomain = parts.length > 2 ? parts[0] : null;
    next();
});

// If we're in production use subdomains to mark the place path
app.get("*", (req, res) => {
    if (environment === "production") {
        res.render(req.subdomain ? "PlacePage" : "Index", { place: req.subdomain, environment });
        return;
    }

    const place = req.path ? req.path.slice(1) : null;
    console.log(place);
    res.render(place ? "PlacePage" : "Index", { place, environment })
});

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
    console.log(`isbetterthandubl.in app listening on port ${PORT}`);
});