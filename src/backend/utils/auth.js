function isLoggedIn(req, res) {
    if (!req.session.userId) {
        res.status(401).json({
            error: "Not logged in"
        });
        return false;
    }
    return true;
}

module.exports = isLoggedIn;