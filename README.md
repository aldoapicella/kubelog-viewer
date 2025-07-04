# Kubernetes Log Viewer

A lightweight web application for viewing real-time logs from Kubernetes pods, built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Real-time log streaming** with Kubernetes API `follow=true` endpoint
- **Live log updates** using ReadableStream and TextDecoder for chunked processing
- **Pause/Resume streaming** with manual controls
- **Auto-reconnection** with exponential backoff (up to 3 retries)
- **Namespace and Pod selection** with intuitive dropdowns
- **Search and filtering** with highlighted matches
- **Auto-scroll functionality** with manual override
- **Responsive design** optimized for all screen sizes
- **Accessibility compliant** with WCAG guidelines
- **Error handling** with retry mechanisms
- **Modern UI** with dark theme

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for modern styling
- **React Query** for efficient data fetching and caching
- **Axios** for HTTP requests with Kubernetes API

## 📁 Project Structure

```
/kubelog-viewer
├── public/
│   └── vite.svg
├── src/
│   ├── api/
│   │   └── k8s.ts            # Axios instance for Kubernetes API
│   ├── hooks/
│   │   ├── useNamespaces.ts  # Fetch namespaces
│   │   ├── usePods.ts        # Fetch pods in namespace
│   │   ├── useLogs.ts        # Legacy: Fetch pod logs (replaced by useLogStream)
│   │   └── useLogStream.ts   # Real-time streaming logs with follow=true
│   ├── components/
│   │   ├── NamespaceSelector.tsx
│   │   ├── PodSelector.tsx
│   │   ├── LogViewer.tsx
│   │   ├── SearchBar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorAlert.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.local               # Environment variables
├── vite.config.ts          # Vite configuration with K8s proxy
├── postcss.config.js       # PostCSS configuration
└── package.json
```

## ⚙️ Environment Setup

Create a `.env.local` file in the project root:

```bash
# Kubernetes API endpoint
VITE_K8S_API=https://your-k8s-api-server:443

# Service account token for authentication
VITE_K8S_TOKEN=your-service-account-token

# Optional: Custom CA certificate path for TLS
VITE_K8S_CA=/path/to/ca.crt
```

### Service Account Setup

To create a service account with appropriate permissions:

```bash
# Create service account
kubectl create serviceaccount log-viewer-sa

# Create cluster role with log reading permissions
kubectl create clusterrole log-viewer --verb=get,list --resource=namespaces,pods,pods/log

# Bind the role to the service account
kubectl create clusterrolebinding log-viewer-binding \
  --clusterrole=log-viewer \
  --serviceaccount=default:log-viewer-sa

# Get the token
kubectl create token log-viewer-sa
```

## 🚀 Development

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start development server**
   ```bash
   pnpm dev
   ```

3. **Build for production**
   ```bash
   pnpm build
   ```

4. **Preview production build**
   ```bash
   pnpm preview
   ```

## 🔧 Configuration

### Vite Proxy Configuration

The development server includes a proxy configuration that:
- Routes `/api/*` requests to your Kubernetes API server
- Automatically injects the `Authorization: Bearer <token>` header
- Handles TLS certificates for secure connections
- Enables CORS for cross-origin requests

### React Query Settings

- **Namespaces**: Cached for 5 minutes
- **Pods**: Cached for 1 minute
- **Log Streaming**: Real-time with `follow=true`, auto-reconnect on disconnect

### Real-Time Log Streaming

The application uses the Kubernetes API's `follow=true` parameter to stream logs in real-time:

```typescript
// Example streaming URL
/api/v1/namespaces/{namespace}/pods/{pod}/log?follow=true&timestamps=true&tailLines=100

// Hook usage
const { lines, isStreaming, error, pause, resume, retry } = useLogStream(
  'my-namespace', 
  'my-pod', 
  { 
    tailLines: 100,           // Number of initial lines to fetch
    sinceTime: '2023-01-01'   // Optional: logs since specific time
  }
);
```

**Streaming Features:**
- **Chunked Processing**: Uses ReadableStream and TextDecoder for efficient parsing
- **Pause/Resume**: Manual control over stream processing
- **Auto-reconnect**: Exponential backoff retry logic (1s, 2s, 4s intervals)
- **Error Recovery**: Graceful handling of network issues and API errors
- **Buffer Management**: Properly handles partial log lines across chunks

## 🎨 UI Components

### NamespaceSelector
- Fetches and displays all available namespaces
- Handles loading and error states
- Accessible dropdown with proper labeling

### PodSelector
- Shows pods in the selected namespace with status information
- Displays pod status, readiness, restart count, and age
- Dependent on namespace selection

### LogViewer
- Real-time log streaming with follow=true endpoint
- Chunked log processing with ReadableStream API
- Pause/resume streaming functionality  
- Search functionality with highlighted matches
- Manual scroll override with auto-scroll toggle
- Connection status indicators and retry mechanisms
- Accessible log output with ARIA labels

### SearchBar
- Live search filtering of log lines
- Configurable line count (1-10,000)
- Responsive layout for mobile and desktop

## 🔒 Security

- Service account-based authentication
- TLS support for secure connections
- Environment variable-based configuration
- No hardcoded credentials in source code

## 📱 Accessibility

- WCAG 2.1 compliant
- Keyboard navigation support
- Screen reader friendly with ARIA labels
- High contrast color scheme
- Focus indicators for all interactive elements

## 🐛 Error Handling

- Network error detection and retry mechanisms
- Kubernetes API error interpretation
- User-friendly error messages
- Graceful degradation when services are unavailable

## 🧪 Testing

Run the test suite:

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui
```

The project includes comprehensive unit tests for:
- **useLogStream hook**: Stream processing, pause/resume, retry logic
- **Component rendering**: React Testing Library integration
- **API error handling**: Network failures and HTTP errors  
- **Search and filter functionality**: Client-side log filtering

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Troubleshooting

### Common Issues

1. **"Authentication failed" error**
   - Verify your service account token is valid
   - Check token expiration date
   - Ensure service account has proper permissions

2. **"Network error" messages**
   - Verify Kubernetes API endpoint URL
   - Check network connectivity
   - Validate TLS certificates if using HTTPS

3. **No pods showing up**
   - Confirm pods exist in the selected namespace
   - Check service account permissions for the namespace
   - Verify pod status (Running pods show more logs)

4. **Logs not updating**
   - Check streaming status indicator (green dot = active stream)
   - Verify pod is actively running and generating logs
   - Use pause/resume button to restart stream if needed
   - Check browser console for streaming errors

5. **Stream keeps disconnecting**
   - Network instability may cause frequent reconnections
   - Check Kubernetes API server connectivity
   - Verify firewall settings allow persistent connections
   - Monitor retry attempts (max 3 before manual retry required)

For additional help, please open an issue on GitHub.
