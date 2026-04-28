/**
		 * @swagger
		 * /auth/login:
		 *   post:
		 *     summary: User login
		 *     description: Authenticate with email, password, device androidId and fingerprint signature
		 *     tags: [Auth]
		 *     requestBody:
		 *       required: true
		 *       content:
		 *         application/json:
		 *           schema:
		 *             type: object
		 *             required: [email, password, androidId, fingerprint]
		 *             properties:
		 *               email:
		 *                 type: string
		 *                 format: email
		 *                 example: "john@company.com"
		 *               password:
		 *                 type: string
		 *                 format: password
		 *                 example: "SecurePass123"
		 *               androidId:
		 *                 type: string
		 *                 example: "a1b2c3d4e5f6"
		 *               fingerprint:
		 *                 type: string
		 *                 example: "device_fingerprint_hash_123"
		 *     responses:
		 *       200:
		 *         description: Login successful
		 *         content:
		 *           application/json:
		 *             schema:
		 *               type: object
		 *               properties:
		 *                 success: { type: boolean, example: true }
		 *                 data:
		 *                   type: object
		 *                   properties:
		 *                     user:
		 *                       $ref: '#/components/schemas/User'
		 *                     accessToken:
		 *                       type: string
		 *                       example: "eyJhbGciOiJIUzI1NiIs..."
		 *                     refreshToken:
		 *                       type: string
		 *                       example: "eyJhbGciOiJIUzI1NiIs..."
		 *       401:
		 *         description: Invalid credentials or device verification failed
		 *       400:
		 *         description: Missing required fields
		 */

export { };
