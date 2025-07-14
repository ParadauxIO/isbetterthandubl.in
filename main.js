import 'dotenv/config';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import fs from "fs";
import { format } from "date-fns";
import {logMiddleware} from "./middleware/log.js";
import {createVisit} from "./middleware/visit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const environment = process.env.NODE_ENV;

const app = express();

app.set('trust proxy', process.env.TRUST_PROXY === 'true');

app.engine(".html", ejs.__express);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "html");

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Logging middleware
app.use(logMiddleware(logsDir));

// Increment the visitor count
app.use(createVisit(process.env.PARADAUX_API_BASE_URL, process.env.PARADAUX_API_SECRET, "isbetterthandubl.in"));

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