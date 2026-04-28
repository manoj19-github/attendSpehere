/**
	 * @swagger
	 * /auth/refresh-token:
	 *   post:
	 *     summary: Refresh access token
	 *     description: Get a new access token using a valid refresh token
	 *     tags: [Auth]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [refreshToken]
	 *             properties:
	 *               refreshToken:
	 *                 type: string
	 *                 example: "eyJhbGciOiJIUzI1NiIs..."
	 *     responses:
	 *       200:
	 *         description: New access token generated
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 success: { type: boolean, example: true }
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     accessToken:
	 *                       type: string
	 *       401:
	 *         description: Invalid or expired refresh token
	 */

export { };
