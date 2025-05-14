export function getGreeting(req, res, next) {
  try {
    res.json({ message: 'Hello, world!' });
  } catch (err) {
    next(err);
  }
}
