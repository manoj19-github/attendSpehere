/**
		 * @swagger
		 * /auth/register:
		 *   post:
		 *     summary: Register a new user
		 *     description: Creates a new user account with employee or admin role
		 *     tags: [Auth]
		 *     requestBody:
		 *       required: true
		 *       content:
		 *         application/json:
		 *           schema:
		 *             type: object
		 *             required: [fullName, email, password]
		 *             properties:
		 *               fullName:
		 *                 type: string
		 *                 example: "John Doe"
		 *               email:
		 *                 type: string
		 *                 format: email
		 *                 example: "john@company.com"
		 *               password:
		 *                 type: string
		 *                 format: password
		 *                 minLength: 6
		 *                 example: "SecurePass123"
		 *               role:
		 *                 type: string
		 *                 enum: [admin, employee]
		 *                 default: employee
		 *                 example: "employee"
		 *     responses:
		 *       201:
		 *         description: User registered successfully
		 *         content:
		 *           application/json:
		 *             schema:
		 *               type: object
		 *               properties:
		 *                 success: { type: boolean, example: true }
		 *                 message: { type: string, example: "User registered successfully" }
		 *       400:
		 *         description: Validation error
		 *         content:
		 *           application/json:
		 *             schema:
		 *               $ref: '#/components/schemas/ErrorResponse'
		 *       409:
		 *         description: Email already exists
		 */

export { };
