/**
		 * @swagger
		 * /device/register:
		 *   post:
		 *     summary: Register or update device
		 *     description: Links a device to the authenticated user. Creates new or updates existing device record.
		 *     tags: [Device]
		 *     security:
		 *       - bearerAuth: []
		 *     requestBody:
		 *       required: true
		 *       content:
		 *         application/json:
		 *           schema:
		 *             type: object
		 *             required: [androidId, deviceModel, osVersion, fingerprint]
		 *             properties:
		 *               androidId:
		 *                 type: string
		 *                 example: "a1b2c3d4e5f6"
		 *               deviceModel:
		 *                 type: string
		 *                 example: "Samsung Galaxy S23"
		 *               osVersion:
		 *                 type: string
		 *                 example: "Android 14"
		 *               fingerprint:
		 *                 type: string
		 *                 example: "device_fingerprint_hash_123"
		 *     responses:
		 *       201:
		 *         description: Device registered successfully
		 *         content:
		 *           application/json:
		 *             schema:
		 *               type: object
		 *               properties:
		 *                 success: { type: boolean, example: true }
		 *                 message: { type: string, example: "Device registered successfully" }
		 *       400:
		 *         description: Missing required fields
		 *       401:
		 *         description: Unauthorized - Invalid or missing token
		 */

export { };
