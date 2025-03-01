import 'dotenv/config';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const environment = process.env.NODE_ENV;

const app = express();

// Sets the rendering engine and path to views.
app.engine(".html", ejs.__express);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "html");

// Extracts subdomain and appends it to the request context.
app.use((req, res, next) => {
    const parts = req.hostname.split('.');
    req.subdomain = parts.length > 2 ? parts[0] : null;
    next();
});

// If we're in production use subdomains to mark the place path
app.get("*", (req, res) => {
    if (environment === "production") {
        console.log(environment)
        res.render(req.subdomain ? "PlacePage" : "Index", { place: req.subdomain });
        return;
    }

    const place = req.path ? req.path.slice(1) : null;
    console.log(place);
    res.render(place ? "PlacePage" : "Index", { place, environment })
});

const PORT = process.env.PORT || 3030; // Changed to match your docker config

app.listen(PORT, () => {
    console.log(`isbetterthandubl.in app listening on port ${PORT}`);
});