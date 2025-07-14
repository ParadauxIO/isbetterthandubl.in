export const createVisit = (apiBaseUrl, apiSecret, project) => {
    return (req, res, next) => {
        if (req.method === 'GET' && req.path === '/') {
            const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress;

            fetch(`${apiBaseUrl}/api/analytics/visits/visit`, {
                method: "POST",
                headers: {
                    'X-SECRET': apiSecret,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ipAddress: ip,
                    userAgent: req.headers['user-agent'] || 'unknown',
                    project,
                }),
            }).catch(err => console.error(err));
        }
        next();
    };
}