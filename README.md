# Kubernetes Log Viewer

A production-ready web application for real-time Kubernetes pod log streaming and analysis. Built with modern web technologies to provide efficient log viewing capabilities for containerized applications.

## Features

### Core Functionality
- **Real-time Log Streaming**: Implements Kubernetes API `follow=true` endpoint for live log updates
- **Stream Processing**: Utilizes ReadableStream API with TextDecoder for efficient chunked data processing
- **Connection Management**: Automated reconnection with exponential backoff strategy (maximum 3 retry attempts)
- **Resource Selection**: Dynamic namespace and pod selection with status information
- **Log Filtering**: Full-text search with regex support and highlighted match visualization
- **Temporal Filtering**: Time-based log filtering with configurable time ranges and date selection
- **Export Functionality**: Log export to file format with metadata preservation and timestamp options
- **Session Management**: Pause/resume streaming capabilities with manual override controls

### User Interface
- **Responsive Design**: Adaptive layout optimized for desktop and mobile viewports
- **Accessibility Compliance**: WCAG 2.1 AA compliant with screen reader support and keyboard navigation
- **Dark Theme**: High-contrast color scheme optimized for extended viewing sessions
- **Auto-scroll Management**: Intelligent scroll behavior with manual override capabilities
- **Status Indicators**: Real-time connection status and streaming state visualization

### Technical Features
- **Error Handling**: Comprehensive error recovery with user-friendly error messages
- **Performance Optimization**: Efficient DOM updates and memory management for large log volumes
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Modern Architecture**: Component-based architecture with React hooks and context management

## Technology Stack

### Frontend Framework
- **React 19**: Latest React version with concurrent features and improved performance
- **TypeScript 5.x**: Strict type safety and enhanced developer experience
- **Vite 6.x**: Fast development server and optimized build pipeline

### Styling and UI
- **Tailwind CSS v4**: Utility-first CSS framework with custom design system
- **PostCSS**: Advanced CSS processing with modern syntax support

### Data Management
- **TanStack Query (React Query)**: Intelligent data fetching, caching, and synchronization
- **Axios**: HTTP client with request/response interceptors and error handling

### Development Tools
- **ESLint**: Code quality enforcement with TypeScript-specific rules
- **Prettier**: Consistent code formatting
- **Vitest**: Fast unit testing framework with TypeScript support

## Project Architecture

### Directory Structure
```
kubelog-viewer/
├── public/
│   └── vite.svg                    # Application favicon
├── src/
│   ├── api/
│   │   └── k8s.ts                  # Kubernetes API client configuration
│   ├── hooks/
│   │   ├── useNamespaces.ts        # Namespace data fetching hook
│   │   ├── usePods.ts              # Pod data fetching hook
│   │   └── useLogStream.ts         # Real-time log streaming hook
│   ├── components/
│   │   ├── NamespaceSelector.tsx   # Namespace selection component
│   │   ├── PodSelector.tsx         # Pod selection component with status display
│   │   ├── LogViewer.tsx           # Main log display and streaming component
│   │   ├── SearchBar.tsx           # Search and filtering controls
│   │   ├── DateRangeFilter.tsx     # Temporal filtering component
│   │   ├── ExportOptionsModal.tsx  # Log export configuration modal
│   │   ├── LoadingSpinner.tsx      # Loading state indicator
│   │   └── ErrorAlert.tsx          # Error display component
│   ├── App.tsx                     # Main application component
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles and Tailwind imports
├── .env.local                      # Environment configuration
├── vite.config.ts                  # Vite build configuration
├── postcss.config.js               # PostCSS configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project dependencies and scripts
```

### Component Architecture
The application follows a component-based architecture with clear separation of concerns:

- **Presentation Components**: UI-focused components with minimal business logic
- **Container Components**: Components that manage state and data fetching
- **Custom Hooks**: Reusable logic for data fetching and state management
- **Utility Functions**: Pure functions for data transformation and validation

## Environment Configuration

### Required Environment Variables
Create a `.env.local` file in the project root with the following configuration:

```bash
# Kubernetes API server endpoint
VITE_K8S_API=https://kubernetes-api-server:6443

# Service account bearer token for authentication
VITE_K8S_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjAwIn0...

# Optional: Custom CA certificate path for TLS verification
VITE_K8S_CA=/path/to/cluster-ca.crt

# Optional: Skip TLS verification (not recommended for production)
VITE_K8S_INSECURE=false
```

### Kubernetes Service Account Setup

#### Step 1: Create Service Account
```bash
kubectl create serviceaccount kubelog-viewer-sa -n default
```

#### Step 2: Create ClusterRole with Required Permissions
```bash
kubectl create clusterrole kubelog-viewer-role \
  --verb=get,list,watch \
  --resource=namespaces,pods,pods/log
```

#### Step 3: Create ClusterRoleBinding
```bash
kubectl create clusterrolebinding kubelog-viewer-binding \
  --clusterrole=kubelog-viewer-role \
  --serviceaccount=default:kubelog-viewer-sa
```

#### Step 4: Generate Service Account Token
```bash
# For Kubernetes 1.24+
kubectl create token kubelog-viewer-sa --duration=8760h

# For older Kubernetes versions
kubectl get secret $(kubectl get serviceaccount kubelog-viewer-sa -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' | base64 --decode
```

### Security Considerations
- Use dedicated service accounts with minimal required permissions
- Implement proper TLS certificate validation in production environments
- Rotate service account tokens regularly
- Consider using RBAC policies to restrict namespace access
- Implement network policies to control API server access

## Development Workflow

### Prerequisites
- Node.js 18.x or higher
- pnpm 8.x or higher (recommended) or npm/yarn
- Access to a Kubernetes cluster with appropriate permissions

### Local Development Setup

#### 1. Dependency Installation
```bash
pnpm install
```

#### 2. Environment Configuration
Copy the example environment file and configure your Kubernetes cluster details:
```bash
cp .env.example .env.local
# Edit .env.local with your cluster configuration
```

#### 3. Development Server
```bash
pnpm dev
```
The development server will start on `http://localhost:5173` with hot module replacement enabled.

#### 4. Production Build
```bash
pnpm build
```
Generates optimized production bundle in the `dist/` directory.

#### 5. Build Preview
```bash
pnpm preview
```
Serves the production build locally for testing.

### Build Configuration

#### Vite Configuration Features
The Vite configuration includes several production-ready features:

- **Development Proxy**: Automatic proxying of `/api/*` requests to Kubernetes API server
- **Authentication Injection**: Automatic injection of `Authorization: Bearer` headers
- **TLS Certificate Handling**: Support for custom CA certificates and insecure connections
- **CORS Configuration**: Proper CORS handling for cross-origin requests
- **Build Optimization**: Tree shaking, code splitting, and asset optimization

#### Proxy Configuration Details
```typescript
// vite.config.ts proxy configuration
proxy: {
  '/api': {
    target: process.env.VITE_K8S_API,
    changeOrigin: true,
    secure: !process.env.VITE_K8S_INSECURE,
    headers: {
      'Authorization': `Bearer ${process.env.VITE_K8S_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }
}
```

## Application Configuration

### Data Fetching Strategy
The application uses TanStack Query for intelligent data management:

#### Namespace Caching
- **Cache Duration**: 2 minutes stale time, 5 minutes garbage collection
- **Refetch Interval**: 2 minutes for namespace list updates
- **Error Handling**: Automatic retry with exponential backoff

#### Pod Data Management
- **Cache Duration**: 30 seconds stale time, 2 minutes garbage collection
- **Refetch Interval**: 1 minute for pod status updates
- **Dependency Management**: Automatic invalidation when namespace changes

#### Log Streaming Configuration
- **Connection Type**: Server-Sent Events via Kubernetes API `/log` endpoint
- **Parameters**: `follow=true`, `timestamps=true`, configurable `sinceSeconds`
- **Buffer Management**: Chunked processing with proper line boundary handling
- **Reconnection Strategy**: Exponential backoff (1s, 2s, 4s) with maximum 3 attempts

### Real-Time Log Streaming Implementation

#### API Endpoint Structure
```
GET /api/v1/namespaces/{namespace}/pods/{pod}/log
Query Parameters:
  - follow=true           # Enable streaming mode
  - timestamps=true       # Include RFC3339 timestamps
  - sinceSeconds={number} # Filter logs from N seconds ago
  - tailLines={number}    # Limit initial log lines (optional)
```

#### Stream Processing Architecture
```typescript
// Streaming implementation overview
interface LogStreamOptions {
  sinceTime?: string;     // RFC3339 timestamp
  sinceSeconds?: number;  // Relative time filter
}

interface LogStreamResult {
  lines: string[];        // Processed log lines
  isStreaming: boolean;   // Connection status
  isRetrying: boolean;    // Reconnection state
  error?: Error;          // Error state
  pause: () => void;      // Manual pause control
  resume: () => void;     // Manual resume control
  retry: () => void;      // Manual reconnection
  clear: () => void;      // Clear log buffer
  exportLogs: (filename?: string, options?: ExportOptions) => void;
}
```

#### Stream Processing Features
- **Chunked Data Processing**: Efficient handling of large log volumes using ReadableStream
- **Line Boundary Detection**: Proper handling of partial lines across network chunks
- **Memory Management**: Configurable log buffer limits to prevent memory overflow
- **Connection Health Monitoring**: Real-time connection status with visual indicators
- **Error Recovery**: Graceful handling of network interruptions and API errors

## Component Documentation

### NamespaceSelector Component
**Purpose**: Provides namespace selection interface with real-time data fetching
**Features**:
- Modern dropdown interface with search capabilities
- Real-time namespace status updates
- Error handling with retry mechanisms
- Loading states with visual indicators
- Keyboard navigation support

**Technical Implementation**:
- Uses custom dropdown instead of native select for better styling control
- Implements click-outside detection for dropdown closure
- Manages local state for search filtering
- Integrates with TanStack Query for data management

### PodSelector Component
**Purpose**: Advanced pod selection with comprehensive status information
**Features**:
- Searchable pod list with real-time filtering
- Pod status visualization (Running, Pending, Failed, etc.)
- Resource information display (Ready status, restart count, age)
- Virtual scrolling for large pod lists (90+ pods)
- Status-based filtering options

**Technical Implementation**:
- Implements virtual scrolling for performance optimization
- Uses compound filtering (search + status)
- Provides detailed pod metadata in selection interface
- Automatic refresh on namespace changes

### LogViewer Component
**Purpose**: Core log display and streaming management component
**Features**:
- Real-time log streaming with follow=true endpoint
- Chunked log processing using ReadableStream API
- Pause/resume streaming functionality
- Search functionality with highlighted matches
- Timestamp parsing and display
- Auto-scroll with manual override
- Connection status indicators
- Log export functionality with multiple format options

**Technical Implementation**:
- Implements efficient DOM updates for large log volumes
- Uses React.memo for performance optimization
- Manages multiple concurrent filters (search, date range, time-based)
- Provides accessibility features with ARIA labels

### SearchBar Component
**Purpose**: Comprehensive filtering and search interface
**Features**:
- Real-time text search with highlighting
- Time-based filtering with quick selection buttons
- Date range filtering for historical log analysis
- Combined filter management

**Technical Implementation**:
- Debounced search input for performance
- Multiple filter state management
- Integration with LogViewer for real-time filtering

### ExportOptionsModal Component
**Purpose**: Advanced log export configuration interface
**Features**:
- Customizable filename generation
- Metadata inclusion options
- Timestamp preservation settings
- Export format selection

**Technical Implementation**:
- Modal overlay with proper focus management
- Form validation and error handling
- Integration with browser download API

## Security Implementation

### Authentication Strategy
- **Service Account Tokens**: Uses Kubernetes service account bearer tokens
- **Token Validation**: Client-side token format validation
- **Secure Storage**: Environment variable-based token management
- **Permission Scoping**: Minimal required permissions (get, list, watch)

### TLS Configuration
- **Certificate Validation**: Configurable CA certificate validation
- **Insecure Mode**: Optional TLS verification bypass for development
- **Proxy Security**: Secure proxy configuration for API requests

### RBAC Integration
The application requires specific Kubernetes permissions:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kubelog-viewer-role
rules:
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get", "list"]
```

## Accessibility Features

### WCAG 2.1 Compliance
- **Level AA**: Full compliance with WCAG 2.1 Level AA guidelines
- **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- **Keyboard Navigation**: Full functionality via keyboard controls
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: High contrast ratios exceeding 4.5:1

### Accessibility Implementation Details
- **Semantic HTML**: Proper use of semantic elements and landmarks
- **ARIA Attributes**: Comprehensive labeling for interactive elements
- **Live Regions**: Dynamic content updates announced to screen readers
- **Error Handling**: Accessible error messages with clear instructions
- **Form Accessibility**: Proper form labeling and validation feedback

## Error Handling and Recovery

### Network Error Management
- **Connection Failures**: Automatic retry with exponential backoff strategy
- **API Errors**: Comprehensive HTTP status code handling
- **Timeout Management**: Configurable request timeouts with graceful degradation
- **Recovery Mechanisms**: User-initiated retry capabilities

### Error Classification
```typescript
interface ErrorTypes {
  NetworkError: 'Connection refused, timeout, or DNS failure';
  AuthenticationError: 'Invalid or expired service account token';
  AuthorizationError: 'Insufficient permissions for requested operation';
  ResourceError: 'Requested namespace or pod not found';
  StreamError: 'Log streaming connection interrupted';
  ValidationError: 'Invalid user input or configuration';
}
```

### Error Recovery Strategies
- **Automatic Retry**: Exponential backoff for transient failures
- **Manual Recovery**: User-initiated retry mechanisms
- **Graceful Degradation**: Partial functionality when services are unavailable
- **Error Persistence**: Error state management across component re-renders

## Testing Framework

### Test Suite Coverage
```bash
# Execute test suite
pnpm test

# Run tests with coverage reporting
pnpm test:coverage

# Watch mode for development
pnpm test:watch

# UI testing interface
pnpm test:ui
```

### Testing Categories

#### Unit Tests
- **Custom Hooks**: useLogStream, useNamespaces, usePods
- **Utility Functions**: Data transformation and validation
- **Component Logic**: State management and event handling

#### Integration Tests
- **API Integration**: Kubernetes API client functionality
- **Component Interaction**: Cross-component data flow
- **Error Scenarios**: Error handling and recovery mechanisms

#### End-to-End Tests
- **User Workflows**: Complete user journey testing
- **Performance Testing**: Large log volume handling
- **Accessibility Testing**: Screen reader and keyboard navigation

### Test Implementation Details
```typescript
// Example test structure
describe('useLogStream Hook', () => {
  test('establishes streaming connection', async () => {
    // Mock Kubernetes API response
    // Test stream initialization
    // Verify data processing
  });

  test('handles connection failures', async () => {
    // Mock network failure
    // Test retry mechanism
    // Verify error state management
  });
});
```

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Lazy loading of non-critical components
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Memory Management**: Efficient log buffer management
- **Virtual Scrolling**: Performance optimization for large datasets

### Network Optimization
- **Request Batching**: Efficient API request consolidation
- **Caching Strategy**: Intelligent data caching with TanStack Query
- **Compression**: Gzip compression for production builds
- **Connection Pooling**: HTTP/2 connection reuse

### Monitoring and Metrics
- **Performance Monitoring**: Core Web Vitals tracking
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: Usage pattern analysis
- **Resource Utilization**: Memory and CPU usage monitoring

## Deployment Strategies

### Production Deployment

#### Container Deployment
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubelog-viewer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kubelog-viewer
  template:
    spec:
      containers:
      - name: kubelog-viewer
        image: kubelog-viewer:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_K8S_API
          value: "https://kubernetes.default.svc"
        - name: VITE_K8S_TOKEN
          valueFrom:
            secretKeyRef:
              name: kubelog-viewer-token
              key: token
```

### Environment-Specific Configuration
- **Development**: Hot module replacement, source maps, debug logging
- **Staging**: Production build with development APIs
- **Production**: Optimized build, minification, error tracking

## License and Contributing

### License
This project is licensed under the MIT License. See the LICENSE file for complete license terms.

### Contributing Guidelines

#### Development Process
1. Fork the repository and create a feature branch
2. Implement changes with comprehensive test coverage
3. Ensure code quality standards compliance
4. Submit pull request with detailed description

#### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Commit Messages**: Conventional commit format

#### Pull Request Requirements
- **Test Coverage**: Minimum 80% code coverage
- **Documentation**: Updated documentation for new features
- **Performance**: No performance regression
- **Accessibility**: WCAG 2.1 compliance maintained

## Troubleshooting Guide

### Common Issues and Solutions

#### Authentication Failures
**Symptoms**: "Authentication failed" or 401 errors
**Diagnosis Steps**:
1. Verify service account token validity: `kubectl get serviceaccount kubelog-viewer-sa -o yaml`
2. Check token expiration: `kubectl get secret <token-secret> -o yaml`
3. Validate permissions: `kubectl auth can-i get pods --as=system:serviceaccount:default:kubelog-viewer-sa`

**Solutions**:
- Regenerate service account token
- Verify ClusterRole and ClusterRoleBinding configuration
- Ensure token is properly configured in environment variables

#### Network Connectivity Issues
**Symptoms**: "Network error" messages, connection timeouts
**Diagnosis Steps**:
1. Verify API server accessibility: `curl -k $VITE_K8S_API/version`
2. Check network policies and firewall rules
3. Validate TLS certificate configuration

**Solutions**:
- Verify Kubernetes API endpoint URL format
- Check network connectivity from application host
- Validate TLS certificates or enable insecure mode for testing

#### Resource Access Problems
**Symptoms**: No pods displaying, empty namespace list
**Diagnosis Steps**:
1. Verify namespace existence: `kubectl get namespaces`
2. Check pod availability: `kubectl get pods -n <namespace>`
3. Validate RBAC permissions: `kubectl describe clusterrole kubelog-viewer-role`

**Solutions**:
- Confirm pods exist in selected namespace
- Verify service account has appropriate permissions
- Check namespace-specific RBAC restrictions

#### Log Streaming Issues
**Symptoms**: Logs not updating, streaming disconnections
**Diagnosis Steps**:
1. Check streaming status indicator (connection state)
2. Verify pod status: `kubectl get pod <pod-name> -n <namespace>`
3. Monitor browser console for streaming errors
4. Validate pod log availability: `kubectl logs <pod-name> -n <namespace>`

**Solutions**:
- Ensure pod is in Running state and generating logs
- Use pause/resume functionality to restart stream
- Check for network stability issues
- Verify Kubernetes API server supports streaming

#### Performance Issues
**Symptoms**: High memory usage, slow rendering, application freezing
**Diagnosis Steps**:
1. Monitor browser memory usage in Developer Tools
2. Check log volume and streaming rate
3. Verify virtual scrolling functionality

**Solutions**:
- Implement log buffer limits
- Use time-based filtering to reduce log volume
- Clear logs periodically using clear button
- Enable virtual scrolling for large datasets

### Debug Mode Configuration
Enable debug logging by setting the following environment variables:
```bash
# Enable detailed logging
VITE_DEBUG=true

# Log level configuration
VITE_LOG_LEVEL=debug

# API request logging
VITE_LOG_API_REQUESTS=true
```

### Browser Compatibility
**Supported Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features**:
- ReadableStream API support
- ES2020 syntax support
- CSS Grid and Flexbox support
- WebSocket connections

### Performance Monitoring
**Metrics to Monitor**:
- Memory usage during long streaming sessions
- Network bandwidth utilization
- CPU usage during log processing
- Browser rendering performance

**Optimization Recommendations**:
- Limit log buffer size to prevent memory overflow
- Use time-based filtering for large log volumes
- Implement log rotation for long-running sessions
- Monitor and optimize DOM update frequency

For additional technical support and bug reports, please create an issue in the project repository with detailed error information, browser console logs, and reproduction steps.
