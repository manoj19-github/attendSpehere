/**
 * @swagger
 * /attendance/report:
 *   get:
 *     summary: Get working hours report (date range)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Report data }
 *       400: { description: Missing dates }
 */

export { };
