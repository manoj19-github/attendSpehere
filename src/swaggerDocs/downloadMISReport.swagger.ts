/**
	 * @swagger
	 * /admin/mis-report:
	 *   get:
	 *     summary: Download monthly MIS report (Excel)
	 *     description: |
	 *       Generates and downloads an Excel (.xlsx) file containing daily working hours
	 *       for all employees within the specified date range. Data sourced from `user_daily_working_hours` view.
	 *     tags: [Admin]
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
	 *         description: Excel file download
	 *         content:
	 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
	 *             schema:
	 *               type: string
	 *               format: binary
	 *       400:
	 *         description: Missing date parameters
	 *       403:
	 *         description: Admin access required
	 */

export { };
