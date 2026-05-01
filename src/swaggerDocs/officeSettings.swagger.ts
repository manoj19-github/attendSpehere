/**
 * @swagger
 * /office-settings/:
 *   get:
 *     summary: Get office configuration
 *     tags: [Office Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Office configuration fetched successfully
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
 *                     OFFICE_LAT:
 *                       type: number
 *                       example: 22.7793
 *                     OFFICE_LNG:
 *                       type: number
 *                       example: 88.25524
 *                     OFFICE_RADIUS:
 *                       type: number
 *                       example: 100
 *                     OFFICE_NAME:
 *                       type: string
 *                       example: AttendSphere HQ
 *                     LOCATION_POLLING_INTERVAL:
 *                       type: number
 *                       example: 30000
 *                     WORKING_HOURS:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: number
 *                           example: 9
 *                         end:
 *                           type: number
 *                           example: 18
 *                         days:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [1,2,3,4,5]
 *
 *   put:
 *     summary: Update office configuration
 *     tags: [Office Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - OFFICE_LAT
 *               - OFFICE_LNG
 *               - OFFICE_RADIUS
 *               - LOCATION_POLLING_INTERVAL
 *               - WORKING_HOURS
 *             properties:
 *               OFFICE_LAT:
 *                 type: number
 *                 example: 22.7793
 *               OFFICE_LNG:
 *                 type: number
 *                 example: 88.25524
 *               OFFICE_RADIUS:
 *                 type: number
 *                 example: 100
 *               OFFICE_NAME:
 *                 type: string
 *                 example: AttendSphere HQ
 *               LOCATION_POLLING_INTERVAL:
 *                 type: number
 *                 example: 30000
 *               WORKING_HOURS:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: number
 *                     example: 9
 *                   end:
 *                     type: number
 *                     example: 18
 *                   days:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [1,2,3,4,5]
 *     responses:
 *       200:
 *         description: Office configuration updated successfully
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
 *                   example: Config updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/OfficeConfig'
 */
export { };
