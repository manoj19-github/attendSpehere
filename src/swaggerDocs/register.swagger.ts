/**
* @swagger
* /auth/register:
*   post:
*     summary: Register new user with device binding
*     description: Creates a new user account and binds it to a specific device.
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - fullName
*               - email
*               - password
*               - fingerPrint
*               - androidId
*               - deviceModel
*               - osVersion
*             properties:
*               fullName:
*                 type: string
*                 minLength: 4
*                 description: User's full name
*                 example: "John Doe"
*               email:
*                 type: string
*                 format: email
*                 description: Company email address
*                 example: "john@company.com"
*               password:
*                 type: string
*                 minLength: 6
*                 description: Account password
*                 example: "SecurePass123"
*               role:
*                 type: string
*                 enum: [admin, employee]
*                 default: employee
*                 description: User role
*               fingerPrint:
*                 type: string
*                 description: Unique device fingerprint
*                 example: "abc123-device-fingerprint"
*               androidId:
*                 type: string
*                 description: Android device ID
*                 example: "ANDROID-987654321"
*               deviceModel:
*                 type: string
*                 description: Device model name
*                 example: "Samsung Galaxy S21"
*               osVersion:
*                 type: string
*                 description: Operating system version
*                 example: "Android 13"
*     responses:
*       201:
*         description: User registered successfully
*       400:
*         description: Validation error (missing or invalid fields)
*       409:
*         description: Email already exists
*/
export { };
