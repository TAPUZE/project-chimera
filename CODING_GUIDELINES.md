# 🎯 Project Chimera - Coding Guidelines & Lessons Learned

## 📋 **CORE PRINCIPLES**

### **1. Always Check Before Creating**
- ✅ **CORRECT**: Use tools to check existing file structure before creating new files
- ❌ **WRONG**: Assume file structure or create files without checking dependencies

### **2. Handle Dependencies Properly**
- ✅ **CORRECT**: Install missing dependencies before creating components that use them
- ❌ **WRONG**: Create components with imports that don't exist yet

### **3. Follow Import/Export Patterns**
- ✅ **CORRECT**: Use consistent import/export patterns across all files
- ❌ **WRONG**: Mix different import styles (default vs named imports inconsistently)

### **4. Create Files in Logical Order**
- ✅ **CORRECT**: Create base dependencies first, then components that use them
- ❌ **WRONG**: Create components before their dependencies exist

---

## 🔧 **REACT & TYPESCRIPT GUIDELINES**

### **Component Structure**
```tsx
// ✅ CORRECT: Proper component structure
import React from 'react';
import { ComponentProps } from './types';

const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

### **Redux Slice Structure**
```tsx
// ✅ CORRECT: Proper Redux slice structure
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SliceState {
  // State interface
}

const initialState: SliceState = {
  // Initial state
};

const sliceName = createSlice({
  name: 'sliceName',
  initialState,
  reducers: {
    // Reducers
  },
});

export const { action1, action2 } = sliceName.actions;
export default sliceName.reducer;
```

### **Import Order**
```tsx
// ✅ CORRECT: Import order
// 1. React imports
import React from 'react';
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography } from '@mui/material';

// 3. Internal imports
import { RootState } from '../store/store';
import { ComponentProps } from './types';
```

---

## 🎨 **MATERIAL-UI GUIDELINES**

### **Theme Usage**
```tsx
// ✅ CORRECT: Use theme consistently
import { useTheme } from '@mui/material/styles';

const Component = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary 
    }}>
      Content
    </Box>
  );
};
```

### **Component Styling**
```tsx
// ✅ CORRECT: Use sx prop for styling
<Box sx={{ 
  display: 'flex', 
  flexDirection: 'column', 
  gap: 2,
  p: 2 
}}>

// ❌ WRONG: Inline styles
<Box style={{ display: 'flex', padding: '16px' }}>
```

---

## 🔄 **REDUX PATTERNS**

### **State Management**
```tsx
// ✅ CORRECT: Proper state selector
const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

// ✅ CORRECT: Proper action dispatch
const dispatch = useDispatch();
dispatch(loginUser({ email, password }));
```

### **Async Actions**
```tsx
// ✅ CORRECT: Create async thunks for API calls
export const fetchAgents = createAsyncThunk(
  'agents/fetchAgents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/agents');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch agents');
    }
  }
);
```

---

## 🌐 **API INTEGRATION**

### **Service Layer**
```tsx
// ✅ CORRECT: Centralized API service
class ApiService {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  async get(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }
}
```

### **Error Handling**
```tsx
// ✅ CORRECT: Proper error handling
try {
  const data = await apiService.get('/agents');
  dispatch(setAgents(data));
} catch (error) {
  dispatch(setError(error.message || 'Unknown error'));
}
```

---

## 📝 **LESSONS LEARNED**

### **Mistake #1: Creating Components Without Dependencies**
- **Issue**: Created components that imported non-existent files
- **Fix**: Always check file structure and install dependencies first
- **Rule**: ✅ Use `semantic_search` or `file_search` to check existing structure before creating new files

### **Mistake #2: Inconsistent Import Patterns**
- **Issue**: Mixed default and named imports inconsistently
- **Fix**: Establish clear import patterns for each type of module
- **Rule**: ✅ Follow the import order: React → Third-party → Internal

### **Mistake #3: Missing Type Definitions**
- **Issue**: Created components without proper TypeScript types
- **Fix**: Always define interfaces for props and state
- **Rule**: ✅ Create type definitions before implementing components

### **Mistake #4: Incomplete Redux Store Configuration**
- **Issue**: Created slices but didn't add them to the store
- **Fix**: Update store configuration when adding new slices
- **Rule**: ✅ Always update store.ts when creating new Redux slices

### **Mistake #5: Missing Error Boundaries**
- **Issue**: No error handling for component failures
- **Fix**: Add error boundaries for major component sections
- **Rule**: ✅ Wrap major sections in error boundaries

### **Mistake #6: Redux Toolkit Import Issues**
- **Issue**: Store cannot find slice reducers even when files exist
- **Fix**: Ensure Redux Toolkit is properly installed and all slice files export default reducer
- **Rule**: ✅ Always verify Redux Toolkit installation and check slice export statements

### **Mistake #7: TypeScript Module Resolution**
- **Issue**: TypeScript cannot resolve modules that exist in the file system
- **Fix**: Check tsconfig.json and ensure proper module resolution strategy
- **Rule**: ✅ Use consistent export patterns and check module resolution

### **Mistake #8: TypeScript Module Resolution in React Apps**
- **Issue**: TypeScript reports "Cannot find module" errors even when files exist in the file system
- **Fix**: Ensure tsconfig.json exists with proper configuration for React apps
- **Rule**: ✅ Always verify tsconfig.json is properly configured for module resolution

### **Mistake #9: Build Warnings for Unused Imports**
- **Issue**: ESLint warnings for unused imports cluttering build output
- **Fix**: Remove unused imports systematically from components
- **Rule**: ✅ Clean up unused imports before committing to reduce warnings

### **Mistake #10: PowerShell Environment Variables**
- **Issue**: Using bash syntax for environment variables in PowerShell fails
- **Fix**: Use PowerShell syntax: `$env:PORT=3001; npm start` instead of `set PORT=3001 && npm start`
- **Rule**: ✅ Use appropriate shell syntax for the user's environment

### **Mistake #11: TypeScript Implicit Any Types**
- **Issue**: Parameters have implicit 'any' type warnings in map functions
- **Fix**: Explicitly type parameters in map functions: `tasks.map((task: Task) => ...)`
- **Rule**: ✅ Always provide explicit types for function parameters

### **Mistake #12: Repository Deployment Preparation**
- **Issue**: Repositories lack proper documentation and deployment instructions for public sharing
- **Fix**: Create comprehensive README, proper .gitignore, and clear setup instructions
- **Rule**: ✅ Always prepare repositories with proper documentation before sharing publicly

### **Mistake #13: Exposing API Keys in Repository Files**
- **Issue**: Real API keys accidentally included in .env.example files trigger GitHub security protection
- **Fix**: Always use placeholder values in example files and remove secrets from git history if needed
- **Rule**: ✅ Never commit real API keys, even in example files - use placeholders only

---

## 🎯 **DEVELOPMENT SUCCESS PATTERNS**

### **Successful Component Creation Pattern**
1. ✅ Check existing file structure and dependencies
2. ✅ Create/verify tsconfig.json configuration
3. ✅ Create components with proper TypeScript types
4. ✅ Use consistent import/export patterns
5. ✅ Clean up unused imports before building
6. ✅ Test build process to ensure no compilation errors

### **Redux Integration Success Pattern**
1. ✅ Create slice with proper TypeScript interfaces
2. ✅ Export selectors for reusable logic
3. ✅ Add slice to store configuration
4. ✅ Use type assertion as temporary workaround for complex typing issues
5. ✅ Document typing issues for future resolution

### **Component Development Best Practices**
1. ✅ Use Material-UI components consistently
2. ✅ Implement proper error handling and loading states
3. ✅ Follow responsive design principles
4. ✅ Add proper accessibility considerations
5. ✅ Clean up unused imports regularly

---

## TypeScript and Redux State Typing Issues

### Redux State Typing Problems
**Issue:** When using `useSelector((state: RootState) => state.tasks)`, TypeScript reports "Property 'tasks' does not exist on type 'unknown'".

**Root Cause:** The RootState type is not properly inferred or there's a circular dependency issue between slice types.

**Workaround:** Use type assertion with `as any` temporarily:
```typescript
const tasksState = useSelector((state: RootState) => state.tasks);
const { tasks, loading, error } = tasksState as any; // TODO: Fix typing issue
```

**Action Required:** This is a temporary workaround. The proper fix requires:
1. Ensuring all slice reducers properly export their types
2. Verifying the store configuration properly types the RootState
3. Checking for circular imports between slices
4. Consider using RTK Query for better type safety

### Field Name Consistency
**Issue:** Backend API uses snake_case (e.g., `agent_id`, `created_at`) but frontend components sometimes expect camelCase.

**Solution:** Always check the actual slice interfaces for correct field names:
- Tasks: `agent_id` not `agentId`
- Chat: `agent_id` not `agentId`, `session_id` not `sessionId`
- Timestamps: `created_at`, `updated_at` not `createdAt`, `updatedAt`

### Selector Export Pattern
**Lesson:** Always export selectors from slices for reusability:
```typescript
// In slice file
export const selectAvailableAgents = (state: { agents: AgentsState }) => 
  state.agents.agents.filter(agent => agent.is_active);

// In component
import { selectAvailableAgents } from '../../store/agentsSlice';
const availableAgents = useSelector(selectAvailableAgents);
```

---

## 🚀 **DEVELOPMENT WORKFLOW**

### **Before Creating New Features**
1. **Check Structure**: Use tools to understand existing file structure
2. **Check Dependencies**: Verify all required packages are installed
3. **Plan Components**: Identify what components/services are needed
4. **Create Base First**: Build dependencies before consumers

### **File Creation Order**
1. **Types/Interfaces**: Create TypeScript definitions first
2. **Services**: Create API services and utilities
3. **Redux Slices**: Create state management
4. **Components**: Create UI components
5. **Pages**: Create page components that use other components

### **Testing Strategy**
```tsx
// ✅ CORRECT: Test component behavior
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../store/store';

test('Component renders correctly', () => {
  render(
    <Provider store={store}>
      <Component />
    </Provider>
  );
  
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

---

## 🔍 **DEBUGGING GUIDELINES**

### **Common Issues and Solutions**

#### **Import Errors**
```bash
# Error: Module not found
# Solution: Check if file exists and path is correct
✅ Use relative paths correctly: '../components/Layout'
❌ Avoid absolute paths that might break: 'src/components/Layout'
```

#### **Type Errors**
```tsx
// ✅ CORRECT: Proper type definitions
interface Props {
  id: string;
  name: string;
  optional?: boolean;
}

// ❌ WRONG: Using 'any' type
const component = (props: any) => { ... }
```

#### **Redux Errors**
```tsx
// ✅ CORRECT: Proper selector usage
const data = useSelector((state: RootState) => state.slice.data);

// ❌ WRONG: Accessing non-existent state
const data = useSelector((state: RootState) => state.nonExistentSlice);
```

---

## 📚 **BEST PRACTICES CHECKLIST**

### **Before Committing Code**
- [ ] All imports are resolved
- [ ] TypeScript types are properly defined
- [ ] Components have proper error handling
- [ ] Redux slices are added to store
- [ ] API calls have proper error handling
- [ ] Components are responsive
- [ ] Accessibility considerations are included
- [ ] Code follows consistent formatting

### **Code Review Checklist**
- [ ] Code follows established patterns
- [ ] No console.log statements in production code
- [ ] Proper error boundaries are in place
- [ ] State management is efficient
- [ ] Components are reusable
- [ ] Documentation is updated

---

## 🎯 **SPECIFIC PROJECT RULES**

### **Project Chimera Specific Guidelines**

#### **Component Naming**
- ✅ **Pages**: `Dashboard`, `Agents`, `Tasks` (PascalCase)
- ✅ **Components**: `Layout`, `AgentCard`, `TaskList` (PascalCase)
- ✅ **Services**: `apiService`, `webSocketService` (camelCase)

#### **File Structure**
```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── services/      # API and utility services
├── store/         # Redux store and slices
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── context/       # React contexts
```

#### **API Integration**
- ✅ **Always use**: Centralized API service
- ✅ **Always handle**: Network errors and loading states
- ✅ **Always validate**: Response data structure

#### **WebSocket Integration**
- ✅ **Use context**: WebSocket context for connection management
- ✅ **Handle reconnection**: Automatic reconnection logic
- ✅ **Clean up**: Proper cleanup on component unmount

---

## 🔄 **CONTINUOUS IMPROVEMENT**

### **When Adding New Lessons**
1. **Identify the Issue**: What went wrong?
2. **Document the Fix**: How was it resolved?
3. **Create the Rule**: How to prevent it in the future?
4. **Update Guidelines**: Add to this document

### **Regular Updates**
- Review this document weekly
- Update patterns as project evolves
- Add new lessons learned
- Refine existing guidelines

---

## 📞 **QUICK REFERENCE**

### **Most Common Commands**
```bash
# Check file structure
semantic_search("component structure")

# Install dependencies
npm install [package-name]

# Create component
# 1. Check dependencies
# 2. Create types
# 3. Create component
# 4. Export properly

# Update Redux store
# 1. Create slice
# 2. Add to store.ts
# 3. Update RootState type
```

### **Emergency Fixes**
- **Import Error**: Check file exists and path is correct
- **Type Error**: Add proper TypeScript interface
- **Redux Error**: Ensure slice is added to store
- **Build Error**: Check all dependencies are installed

---

**Remember**: This document should be updated every time we encounter and fix a new issue. It's a living guide that helps maintain code quality and consistency across the project.
