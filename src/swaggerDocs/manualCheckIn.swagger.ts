/**
 * @swagger
 * /location/checkin:
 *   post:
 *     summary: Manual first checkin of the day
 *     description: Required first checkin. Must be within office (≤100m)
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       200: { description: Checkin successful }
 *       400: { description: Outside office area }
 */

export { };
