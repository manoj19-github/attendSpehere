/**
 * @swagger
 * /device/register:
 *   post:
 *     summary: Register or update device
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [androidId, deviceModel, osVersion]
 *             properties:
 *               androidId: { type: string }
 *               deviceModel: { type: string }
 *               osVersion: { type: string }
 *               fingerprint: { type: string }
 *     responses:
 *       201: { description: Device registered }
 *       400: { description: Missing fields }
 *       401: { description: Unauthorized }
 */

export { };
