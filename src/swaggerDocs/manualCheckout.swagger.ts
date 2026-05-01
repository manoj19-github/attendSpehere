/**
 * @swagger
 * /location/checkout:
 *   post:
 *     summary: Manual Checkout
 *     description: Allows a user to manually checkout from office location.
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *                 example: 22.5726
 *               lng:
 *                 type: number
 *                 example: 88.3639
 *     responses:
 *       200:
 *         description: Checkout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Checkout successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     distance:
 *                       type: number
 *                       example: 45.23
 *                     status:
 *                       type: string
 *                       example: out_office_area
 *                     checkoutTime:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-05-01T17:30:00.000Z
 *                     totalWorkingHours:
 *                       type: number
 *                       example: 7.5
 *       400:
 *         description: Invalid request (e.g. not checked in or outside office)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You are not checked in
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export { };
