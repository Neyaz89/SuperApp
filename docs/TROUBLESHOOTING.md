# 🔧 Troubleshooting - Unmatched Routes Error

## Problem
Getting "unmatched routes" or "page could not be found" error when trying to access HTML5 games.

## ✅ Quick Fix (Try This First)

### Option 1: Clear Metro Cache (Recommended)

**Windows:**
```bash
# Run the fix script
fix-routes.bat
```

**Or manually:**
```bash
# Stop Metro bundler (Ctrl+C in terminal)

# Clear cache
rmdir /s /q node_modules\.cache
rmdir /s /q .expo

# Restart
npm start
```

**Mac/Linux:**
```bash
# Stop Metro bundler (Ctrl+C in terminal)

# Clear cache
rm -rf node_modules/.cache
rm -rf .expo

# Restart
npm start
```

### Option 2: Full Reset

```bash
# Stop Metro bundler

# Clear everything
rmdir /s /q node_modules
rmdir /s /q .expo
rmdir /s /q node_modules\.cache

# Reinstall
npm install

# Start fresh
npm start
```

## 🔍 Verify Files Exist

Check that these files exist:

```
✅ app/games/html5-browser.tsx
✅ app/games/html5-player.tsx
✅ services/html5GamesService.ts
✅ app/_layout.tsx (with routes)
✅ games/screens/GamesHome.tsx (with featured card)
```

## 🎯 Verify Routes in app/_layout.tsx

Make sure these lines exist in `app/_layout.tsx`:

```typescript
<Stack.Screen name="games/html5-browser" />
<Stack.Screen name="games/html5-player" />
```

## 🔄 Restart Development Server

After clearing cache:

```bash
# Start with cache reset
npm start -- --reset-cache

# Or
npx expo start -c
```

## 📱 Reload App

After server restarts:

1. **Android**: Press `r` in terminal or shake device → Reload
2. **iOS**: Press `r` in terminal or Cmd+R in simulator
3. **Web**: Refresh browser (Ctrl+R or Cmd+R)

## 🐛 Common Issues & Solutions

### Issue 1: Metro Bundler Cache
**Solution**: Clear cache with `npm start -- --reset-cache`

### Issue 2: Old Build
**Solution**: Delete `.expo` folder and restart

### Issue 3: Node Modules
**Solution**: Delete `node_modules` and run `npm install`

### Issue 4: TypeScript Errors
**Solution**: Run `npx tsc --noEmit` to check for errors

### Issue 5: Route Not Registered
**Solution**: Verify `app/_layout.tsx` has the routes

## ✅ Step-by-Step Fix

1. **Stop Metro Bundler**
   - Press `Ctrl+C` in terminal

2. **Clear Cache**
   ```bash
   rmdir /s /q .expo
   rmdir /s /q node_modules\.cache
   ```

3. **Restart Metro**
   ```bash
   npm start -- --reset-cache
   ```

4. **Reload App**
   - Press `r` in terminal
   - Or shake device → Reload

5. **Test Navigation**
   - Go to Games section
   - Tap "HTML5 Games" card
   - Should open browser

## 🔍 Debug Navigation

Add console logs to verify navigation:

```typescript
// In games/screens/GamesHome.tsx
const handlePress = () => {
  console.log('Navigating to:', HTML5_FEATURED.route);
  router.push(HTML5_FEATURED.route as any);
};
```

## 📊 Verify File Structure

Your structure should look like:

```
app/
├── _layout.tsx          ← Routes registered here
├── games.tsx            ← Points to GamesHome
└── games/
    ├── html5-browser.tsx  ← Game browser
    ├── html5-player.tsx   ← Game player
    ├── tap-reflex.tsx
    ├── snake.tsx
    └── ... (other games)

games/
└── screens/
    └── GamesHome.tsx    ← Featured card here

services/
└── html5GamesService.ts ← Game catalog
```

## 🎯 Test Each Step

1. **Test Route Registration**
   ```typescript
   // In app/_layout.tsx
   console.log('Routes registered');
   ```

2. **Test Navigation**
   ```typescript
   // In GamesHome.tsx
   console.log('Navigating to:', route);
   ```

3. **Test File Load**
   ```typescript
   // In html5-browser.tsx
   console.log('HTML5 Browser loaded');
   ```

## 🚀 If Still Not Working

1. **Check Expo Version**
   ```bash
   npx expo --version
   ```

2. **Update Expo**
   ```bash
   npm install expo@latest
   ```

3. **Check React Navigation**
   ```bash
   npm list expo-router
   ```

4. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 💡 Alternative: Use Direct Import

If routing still fails, you can use direct import:

```typescript
// In games/screens/GamesHome.tsx
import { useRouter } from 'expo-router';

// Instead of:
router.push('/games/html5-browser');

// Try:
router.push('/(tabs)/games/html5-browser');

// Or use href:
<Link href="/games/html5-browser">
  <Text>HTML5 Games</Text>
</Link>
```

## 📞 Still Having Issues?

1. Check Metro bundler logs for errors
2. Look for TypeScript errors: `npx tsc --noEmit`
3. Check console logs in app
4. Verify all files are saved
5. Try restarting VS Code/editor

## ✅ Success Checklist

- [ ] Metro cache cleared
- [ ] App reloaded
- [ ] Files exist in correct locations
- [ ] Routes registered in _layout.tsx
- [ ] No TypeScript errors
- [ ] Navigation works

## 🎉 Once Fixed

You should be able to:
1. Open Games section
2. See "HTML5 Games" featured card
3. Tap card → Opens game browser
4. See 25+ games
5. Tap game → See ad → Play game

---

**Most Common Fix**: Clear Metro cache and restart!

```bash
npm start -- --reset-cache
```

Then press `r` to reload the app.
