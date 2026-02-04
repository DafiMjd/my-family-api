# Debug Guide

This project has 5 debug configurations available in Cursor/VS Code.

## Available Configurations

### 1. 🚀 Debug API Server (Recommended)
**Use this for:** Normal API debugging

- Starts the Express server on port 3000
- Loads environment variables from `.env`
- Sets breakpoints in any TypeScript file
- Auto-reloads when you restart

**How to use:**
1. Set breakpoints in your code
2. Press `F5` or click "Debug API Server"
3. Test your API endpoints (e.g., `http://localhost:3000/health`)
4. Code will pause at breakpoints

---

### 2. 📄 Debug Current TypeScript File
**Use this for:** Testing individual files or functions

- Runs whatever `.ts` file you have open
- Useful for testing utilities or standalone functions

**How to use:**
1. Open any `.ts` file (e.g., a service or repository)
2. Select "Debug Current TypeScript File"
3. Press `F5`

---

### 3. 🔗 Attach to Running Process
**Use this for:** Debugging an already running server

First, start your server with debugging enabled:
```bash
node --inspect dist/app.js
# or
node --inspect -r ts-node/register -r tsconfig-paths/register src/app.ts
```

Then select "Attach to Running Process" and press `F5`.

---

### 4. 🔄 Debug with Nodemon
**Use this for:** Hot reload debugging (experimental)

- Server restarts automatically when you save files
- Maintains debug connection through restarts
- May be slower than normal debugging

**Note:** This keeps the debugger attached through file changes.

---

### 5. 🌱 Debug Prisma Seed
**Use this for:** Debugging database seeding

- Runs `prisma/seed.ts` with debugging
- Useful for testing seed data or Prisma operations

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Start Debugging | `F5` |
| Stop Debugging | `Shift + F5` |
| Restart Debugging | `Cmd/Ctrl + Shift + F5` |
| Continue | `F5` |
| Step Over | `F10` |
| Step Into | `F11` |
| Step Out | `Shift + F11` |
| Toggle Breakpoint | `F9` |

---

## Setting Breakpoints

### Standard Breakpoint
Click in the gutter (left of line numbers) or press `F9`

### Conditional Breakpoint
Right-click in gutter → "Add Conditional Breakpoint"
- Example: `req.query.id === "123"`
- Example: `person.name === "John"`

### Logpoint
Right-click in gutter → "Add Logpoint"
- Logs message without stopping execution
- Example: `User ID: {userId}, Name: {user.name}`

---

## Debug Console

While debugging, use the Debug Console to:
- Inspect variables: `req.body`
- Call functions: `await personService.getAllPersons()`
- Evaluate expressions: `person.birthDate.toISOString()`

---

## Tips

1. **Source Maps:** Already enabled - you can debug TypeScript directly
2. **Path Aliases:** `@/` imports work correctly in debugging
3. **Environment:** `.env` file is loaded automatically
4. **Skip Node Internals:** Node.js internal files are hidden by default
5. **Integrated Terminal:** Server output appears in the integrated terminal

---

## Troubleshooting

### Breakpoint not hit?
- Check if the file is actually executed
- Ensure source maps are working (`"sourceMap": true` in tsconfig.json)
- Restart the debug session

### Port already in use?
- Stop any running instance: `lsof -ti:3000 | xargs kill -9`
- Or change the port in `.env`

### Can't attach to process?
- Ensure the process was started with `--inspect` flag
- Check the port is 9229 (default inspect port)

---

## Example Debugging Session

1. Open `src/features/persons/person.controller.ts`
2. Set breakpoint on line with `const person = await personService.getPersonById(id);`
3. Press `F5` to start "Debug API Server"
4. Open browser/Postman: `GET http://localhost:3000/api/person/one?id=some-id`
5. Code pauses at breakpoint
6. Inspect variables in left sidebar or hover over code
7. Step through with `F10` (step over) or `F11` (step into)
8. Continue with `F5`

Happy debugging! 🐛
