/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with password or fingerprint
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, androidId]
 *             properties:
 *               email: { type: string, example: "john@company.com" }
 *               password: { type: string, example: "SecurePass123" }
 *               androidId: { type: string, example: "a1b2c3d4" }
 *               fingerprint: { type: string, example: "fp_hash_123" }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials or device }
 */

export { };
