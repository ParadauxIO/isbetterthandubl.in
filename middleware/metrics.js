// Prometheus instrumentation. Triplicated across cans.ie, ifuckedur.mom and
// isbetterthandubl.in (see CLAUDE.md) — change all three together.
import client from "prom-client";

// One registry per process. collectDefaultMetrics adds Node/process gauges
// (heap, event-loop lag, GC, open FDs, …).
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
});

// Times every request except the /metrics scrape. `route` is the matched
// Express route pattern, not the raw URL, so arbitrary/scanner paths collapse
// to "other" instead of exploding label cardinality.
export const metricsMiddleware = (req, res, next) => {
    if (req.path === "/metrics") return next();
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
        end({
            method: req.method,
            route: req.route?.path ?? "other",
            status_code: res.statusCode,
        });
    });
    next();
};

// Exposes the Prometheus exposition format on /metrics.
export const metricsHandler = async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
};
