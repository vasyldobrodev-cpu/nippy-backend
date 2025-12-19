# Swagger API Documentation Setup

## ✅ Swagger is Now Enabled!

I've successfully enabled Swagger API documentation in your backend. Here's how to access and use it.

## 🚀 How to Access Swagger UI

1. **Start your backend server:**
   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:3000/api-docs
   ```

   Or if your server is running on a different port, use:
   ```
   http://localhost:<PORT>/api-docs
   ```

## 📝 What Was Changed

### Files Modified:
1. **`src/app.ts`**
   - Added import for `setupSwagger`
   - Called `setupSwagger(app)` to initialize Swagger middleware
   - Added console log to show Swagger URL on server start

2. **`src/config/swagger.ts`**
   - Updated file paths to use `path.join()` for better path resolution
   - This ensures Swagger can find your route and controller files correctly

## 📚 Current Swagger Documentation

Swagger is configured to scan:
- `src/routes/*.ts` - All route files
- `src/controllers/*.ts` - All controller files

### Currently Documented Routes:
- ✅ File upload endpoints (`/api/files/*`) - Already have Swagger annotations

### Routes That Need Documentation:
You can add Swagger annotations to other routes by adding JSDoc comments like this:

```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);
```

## 🔐 Authentication in Swagger

Swagger is configured with Bearer Token authentication. To test authenticated endpoints:

1. Click the **"Authorize"** button at the top of the Swagger UI
2. Enter your JWT token (without the "Bearer " prefix)
3. Click **"Authorize"**
4. Now you can test authenticated endpoints directly from Swagger

## 🎯 Features Available

- **Interactive API Testing** - Test endpoints directly from the browser
- **Request/Response Schemas** - See expected request and response formats
- **Authentication Support** - Test authenticated endpoints with JWT tokens
- **API Explorer** - Browse all available endpoints organized by tags

## 🔧 Configuration

Swagger configuration is in `src/config/swagger.ts`:

- **Title:** AWS E-commerce Freelancing Platform API
- **Version:** 1.0.0
- **Base URL:** `http://localhost:3000` (or `process.env.API_URL`)
- **Security:** Bearer Token (JWT) authentication

## 📖 Adding More Documentation

To document additional endpoints, add Swagger JSDoc comments above your route handlers. See examples in `src/routes/files.ts` for reference.

## 🐛 Troubleshooting

### Swagger UI shows "Failed to load API definition"
- Make sure your server is running
- Check that route/controller files have proper Swagger annotations
- Verify file paths in `swagger.ts` are correct

### Endpoints not showing up
- Ensure you have `@swagger` JSDoc comments above your routes
- Check that file paths in Swagger config match your project structure
- Restart the server after adding new annotations

### Authentication not working
- Make sure you're entering the JWT token correctly (without "Bearer " prefix)
- Verify your token hasn't expired
- Check that the endpoint requires authentication

## 🎉 Next Steps

1. Start your server: `npm run dev`
2. Visit: `http://localhost:3000/api-docs`
3. Explore your API documentation!
4. Add Swagger annotations to other routes as needed

---

**Happy API Documenting! 📚**

