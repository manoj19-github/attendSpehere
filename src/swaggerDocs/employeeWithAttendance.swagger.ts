/**
 * @swagger
 * /all-employees-with-working-hours:
 *   get:
 *     summary: Get paginated attendance with working hours for all employees
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           example: manoj
 *         description: Search by full name, email, or date
 *       - in: query
 *         name: hoursFilter
 *         required: false
 *         schema:
 *           type: string
 *           enum: [below_8, above_8]
 *           example: below_8
 *         description: Filter by working hours (below or above/equal 8 hours)
 *     responses:
 *       200:
 *         description: Successfully fetched attendance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             example: "uuid"
 *                           full_name:
 *                             type: string
 *                             example: "Manoj Santra"
 *                           email:
 *                             type: string
 *                             example: "manoj@email.com"
 *                           event_date:
 *                             type: string
 *                             format: date
 *                             example: "2026-05-02"
 *                           working_hours:
 *                             type: number
 *                             example: 7.5
 *                           has_checkin:
 *                             type: boolean
 *                             example: true
 *                           has_checkout:
 *                             type: boolean
 *                             example: false
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 120
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 12
 */
export { };
