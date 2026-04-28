
/**
 * @swagger
 * /attendance/report:
 *   get:
 *     summary: Get daily working hours report
 *     description: |
 *       Returns daily working hours calculated from the `user_daily_working_hours` view.
 *       The view pairs checkin/checkout events into sessions and sums hours per day.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Working hours report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkingHoursReport'
 *       400:
 *         description: startDate and endDate are required
 *       401:
 *         description: Unauthorized
 */

export { };
