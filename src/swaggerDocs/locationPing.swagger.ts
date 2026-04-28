/**
		 * @swagger
		 * /location/ping:
		 *   post:
		 *     summary: Location ping (CRITICAL)
		 *     description: |
		 *       **Core geofence logic endpoint.**
		 *
		 *       Processes employee GPS coordinates and:
		 *       - Calculates Haversine distance from office
		 *       - Updates Redis real-time state (key: `user:{userId}`)
		 *       - Triggers checkin when entering office (≤100m)
		 *       - Triggers checkout when leaving office (>100m)
		 *       - Logs distance-based locations (500m, 1000m, 1500m...) when outside
		 *       - Logs time-based locations every 15 minutes when outside
		 *       - Only logs during working hours (Mon-Fri, 9AM-6PM)
		 *     tags: [Location]
		 *     security:
		 *       - bearerAuth: []
		 *     requestBody:
		 *       required: true
		 *       content:
		 *         application/json:
		 *           schema:
		 *             $ref: '#/components/schemas/LocationPing'
		 *     responses:
		 *       200:
		 *         description: Location processed successfully
		 *         content:
		 *           application/json:
		 *             schema:
		 *               type: object
		 *               properties:
		 *                 success: { type: boolean, example: true }
		 *                 data:
		 *                   $ref: '#/components/schemas/LocationResponse'
		 *       400:
		 *         description: Invalid coordinates
		 *       401:
		 *         description: Unauthorized
		 */

export { };
