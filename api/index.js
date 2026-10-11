const app = require('../server/index');

module.exports = (req, res) => {
  const apiPath = req.query?.__apiPath;
  if (typeof apiPath !== 'string' || !apiPath) {
    return res.status(400).json({ message: 'API route is missing.' });
  }

  // Vercel rewrites /api/* to this single function. Restore the original
  // Express path and keep any query parameters sent by the client.
  const query = new URL(req.url, 'http://localhost').searchParams;
  query.delete('__apiPath');
  const remainingQuery = query.toString();
  req.url = `/api/${apiPath}${remainingQuery ? `?${remainingQuery}` : ''}`;
  return app(req, res);
};
