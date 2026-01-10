// @desc    Health Check
// @route   GET /api/v1/health
// @access  Public
export const getHealth = (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
};
