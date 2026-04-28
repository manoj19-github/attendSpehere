/**
 * @swagger
 * /location/ping:
 *   post:
 *     summary: Location ping (CRITICAL - Background polling)
 *     description: |
 *       Core geofence endpoint. Processes GPS coords:
 *       - Auto checkin after first manual checkin
 *       - Auto checkout on exit
 *       - Distance/time-based logging outside office
 *       - Only active during working hours (9AM-6PM)
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
 *               lat: { type: number, example: 28.6139 }
 *               lng: { type: number, example: 77.2090 }
 *     responses:
 *       200: { description: Location processed }
 *       400: { description: Invalid coordinates }
 *       401: { description: Unauthorized }
 */

export { };
