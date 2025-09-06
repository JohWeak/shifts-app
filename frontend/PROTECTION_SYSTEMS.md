# 🛡️ Protection Systems Documentation

This application includes comprehensive protection systems to prevent infinite loops, excessive re-renders, and UI
freezes.

## 🎯 Overview

### Protection Layers:

1. **Component Render Protection** - Prevents infinite re-render loops
2. **Global Render Protection** - Application-wide render monitoring
3. **Redux Action Protection** - Prevents action flooding
4. **API Request Timeouts** - Request duration limits
5. **Development Monitor** - Real-time protection status

## 🔧 Available Tools

### 1. Component Render Protection

**Hook: `useRenderProtection`**

```javascript
import { useRenderProtection } from 'shared/hooks/useRenderProtection';

const MyComponent = () => {
    const { isBlocked, renderCount } = useRenderProtection('MyComponent');
    
    if (isBlocked) {
        return <div>Component temporarily blocked...</div>;
    }
    
    return <div>Normal content</div>;
};
```

**HOC: `withRenderProtection`**

```javascript
import { withRenderProtection } from 'shared/hooks/useRenderProtection';

const ProtectedComponent = withRenderProtection(MyComponent, 'MyComponent');
```

### 2. Global Application Protection

**HOC: `withGlobalProtection`**

```javascript
import { withGlobalProtection } from 'shared/hoc/withGlobalProtection';

const GloballyProtectedApp = withGlobalProtection(App, 'App');
```

**Combined Protection:**

```javascript
import { withFullProtection } from 'shared/hoc/withGlobalProtection';

const FullyProtectedComponent = withFullProtection(MyComponent, 'MyComponent');
```

### 3. API Request Protection

**Hook: `useRequestTimeout`**

```javascript
import { useRequestTimeout } from 'shared/hooks/useRequestTimeout';

const MyComponent = () => {
    const { withTimeout, cancelAllRequests } = useRequestTimeout();
    
    const fetchData = withTimeout(async () => {
        const response = await fetch('/api/data');
        return response.json();
    }, 10000, 'fetch-data'); // 10 second timeout
    
    return <div>...</div>;
};
```

### 4. Redux Action Protection

Automatically included via middleware in store configuration. No additional setup required.

### 5. Development Monitor

**Component: `ProtectionMonitor`**

```javascript
import ProtectionMonitor from 'shared/ui/components/ProtectionMonitor';

// Add to your App component (only shows in development)
const App = () => (
    <div>
        <YourAppContent />
        <ProtectionMonitor />
    </div>
);
```

## ⚙️ Configuration

### Default Thresholds:

**Component Render Protection:**

- Warning: 30 renders/second
- Block: 60 renders/second
- Monitoring window: 1 second

**Global Protection:**

- Block: 100 renders/second across all components
- Cooldown: 1 second

**Action Protection:**

- Block: 50 actions/second per action type
- Cooldown: 2 seconds

**Request Timeouts:**

- Default: 30 seconds
- Long requests: 60 seconds

## 🚨 What Happens When Protection Triggers?

### Component Level:

- Component renders a "temporarily blocked" message
- Console warnings/errors with details
- Automatic unblock after cooldown period

### Global Level:

- Full-screen protection overlay
- All rendering temporarily blocked
- Automatic recovery after cooldown

### Action Level:

- Actions are discarded (not processed)
- Warning notifications to user
- Console logging for debugging

### Request Level:

- Request is aborted
- Timeout error is thrown
- Active request tracking is cleaned up

## 🛠️ Debugging

### Console Messages:

- `[RenderProtection]` - Component render issues
- `[GlobalProtection]` - Application-wide issues
- `[ActionProtection]` - Redux action issues
- `[RequestTimeout]` - API timeout issues

### Development Monitor:

- Real-time protection status
- Active component counts
- Blocked action lists
- Visual indicators for issues

## 📋 Best Practices

### 1. Prevent Issues:

```javascript
// ✅ Good - stable dependencies
useEffect(() => {
    fetchData();
}, [userId, stableCallback]);

// ❌ Bad - object dependency causes infinite loops
useEffect(() => {
    fetchData();
}, [userData]); // userData is recreated on every render
```

### 2. Use Protection Selectively:

```javascript
// Use on components that might have dependency issues
const ScheduleComponent = withRenderProtection(Schedule, 'Schedule');

// Don't overuse - simple components don't need protection
const SimpleButton = ({ onClick, children }) => (
    <button onClick={onClick}>{children}</button>
);
```

### 3. Monitor in Development:

- Always include `<ProtectionMonitor />` during development
- Watch console for protection warnings
- Fix root causes, don't just rely on protection

### 4. Test Protection Systems:

```javascript
// Intentionally trigger protection for testing
const TestComponent = () => {
    const [, forceRender] = useReducer(x => x + 1, 0);
    
    useEffect(() => {
        // This will trigger protection
        const interval = setInterval(forceRender, 10);
        return () => clearInterval(interval);
    }, []);
    
    return <div>Testing protection...</div>;
};
```

## 🔍 Troubleshooting

### "Component temporarily blocked":

1. Check component's useEffect dependencies
2. Look for object/array dependencies that change on every render
3. Use useCallback/useMemo for stable references

### "Global block activated":

1. Multiple components have render issues simultaneously
2. Check for shared context or state that's changing rapidly
3. Review recent changes to global state management

### Actions being blocked:

1. Check if you're dispatching actions in render
2. Look for action dispatching in useEffect without proper dependencies
3. Review action creators for unintended loops

### API timeouts:

1. Check network conditions
2. Review server response times
3. Consider increasing timeout for slow endpoints:

```javascript
const slowRequest = withLongTimeout(fetchLargeData, 'large-data');
```

## 🎛️ Advanced Configuration

### Custom Thresholds:

```javascript
// Modify protection hook parameters
const { isBlocked } = useRenderProtection('MyComponent', {
    warningThreshold: 20,
    blockThreshold: 40,
    monitoringWindow: 2000
});
```

### Custom Request Timeouts:

```javascript
const customTimeout = useRequestTimeout();
const verySlowRequest = customTimeout.withTimeout(slowFetch, 120000); // 2 minutes
```

Remember: Protection systems are safety nets, not solutions. Always fix the root cause of infinite loops and excessive
re-renders!