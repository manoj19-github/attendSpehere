/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName: { type: string, example: "John Doe" }
 *               email: { type: string, format: email, example: "john@company.com" }
 *               password: { type: string, minLength: 6, example: "SecurePass123" }
 *               role: { type: string, enum: [admin, employee], default: employee }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Validation error }
 *       409: { description: Email exists }
 */

export { };
