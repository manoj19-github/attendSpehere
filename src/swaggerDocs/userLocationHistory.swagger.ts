/**
 * @swagger
 * /admin/user/{id}/location-history:
 *   get:
 *     summary: Get user's location history
 *     description: Returns GPS trail for a specific user within date range (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
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
 *         description: Location history retrieved
 *       400:
 *         description: Missing date parameters
 *       403:
 *         description: Admin access required
 */

export { };
