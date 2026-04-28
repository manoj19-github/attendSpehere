/**
	 * @swagger
	 * /admin/user/{id}/report:
	 *   get:
	 *     summary: Get user's full report
	 *     tags: [Admin]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema: { type: string, format: uuid }
	 *       - in: query
	 *         name: startDate
	 *         required: true
	 *         schema: { type: string, format: date }
	 *       - in: query
	 *         name: endDate
	 *         required: true
	 *         schema: { type: string, format: date }
	 *     responses:
	 *       200: { description: Full report }
	 */

export { };
