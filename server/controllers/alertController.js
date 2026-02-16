import mongoose from 'mongoose';
import Alert from '../models/Alert.js';

// @desc    Get alerts for the logged-in user (paginated)
// @route   GET /api/v2/alerts/my?portal=student|parent
// @access  Private
export const getMyAlerts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        let limit = parseInt(req.query.limit);
        if (!limit || limit < 1 || isNaN(limit)) limit = 20;
        limit = Math.min(limit, 100); // clamp to max 100
        const skip = (page - 1) * limit;
        const portal = req.query.portal || req.user.role; // fallback to role

        const filter = {
            user: req.user._id,
            organization: req.organizationId
        };

        const [rawAlerts, total, unreadCount] = await Promise.all([
            Alert.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Alert.countDocuments(filter),
            Alert.countDocuments({ ...filter, readByPortals: { $nin: [portal] } })
        ]);

        // Compute isRead per-alert based on the requesting portal
        const alerts = rawAlerts.map(a => ({
            ...a,
            isRead: (a.readByPortals || []).includes(portal)
        }));

        res.json({
            alerts,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get Alerts Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark a single alert as read for a specific portal
// @route   PUT /api/v2/alerts/:alertId/read
// @access  Private
const VALID_PORTALS = ['student', 'parent'];
export const markAlertRead = async (req, res) => {
    try {
        const { alertId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(alertId)) {
            return res.status(400).json({ message: 'Invalid alertId' });
        }

        const portal = req.body.portal || req.user.role;
        if (!VALID_PORTALS.includes(portal)) {
            return res.status(400).json({ message: 'Invalid portal value' });
        }

        const alert = await Alert.findOneAndUpdate(
            {
                _id: alertId,
                user: req.user._id,
                organization: req.organizationId
            },
            { $addToSet: { readByPortals: portal } },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        res.json({ ...alert.toObject(), isRead: true });
    } catch (error) {
        console.error('Mark Alert Read Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark all alerts as read for the logged-in user on a specific portal
// @route   PUT /api/v2/alerts/read-all
// @access  Private
export const markAllRead = async (req, res) => {
    try {
        const portal = req.body.portal || req.user.role;

        await Alert.updateMany(
            {
                user: req.user._id,
                organization: req.organizationId,
                readByPortals: { $nin: [portal] }
            },
            { $addToSet: { readByPortals: portal } }
        );

        res.json({ message: 'All alerts marked as read' });
    } catch (error) {
        console.error('Mark All Read Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
