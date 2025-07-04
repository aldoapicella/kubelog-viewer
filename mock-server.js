import express from 'express';
import cors from 'cors';

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// Mock namespaces - Following real Kubernetes API v1.Namespace schema
app.get('/api/v1/namespaces', (req, res) => {
  res.json({
    apiVersion: 'v1',
    kind: 'NamespaceList',
    metadata: {
      resourceVersion: '12345'
    },
    items: [
      { 
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { 
          name: 'default',
          uid: 'abc123-def456-ghi789',
          creationTimestamp: '2024-01-01T00:00:00Z',
          resourceVersion: '1000'
        },
        spec: {
          finalizers: ['kubernetes']
        },
        status: { 
          phase: 'Active' 
        }
      },
      { 
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { 
          name: 'kube-system',
          uid: 'abc123-def456-ghi790',
          creationTimestamp: '2024-01-01T00:00:00Z',
          resourceVersion: '1001'
        },
        spec: {
          finalizers: ['kubernetes']
        },
        status: { 
          phase: 'Active' 
        }
      },
      { 
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { 
          name: 'kube-public',
          uid: 'abc123-def456-ghi791',
          creationTimestamp: '2024-01-01T00:00:00Z',
          resourceVersion: '1002'
        },
        spec: {
          finalizers: ['kubernetes']
        },
        status: { 
          phase: 'Active' 
        }
      },
      { 
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { 
          name: 'dev',
          uid: 'abc123-def456-ghi792',
          creationTimestamp: '2024-01-01T00:00:00Z',
          resourceVersion: '1003'
        },
        spec: {
          finalizers: ['kubernetes']
        },
        status: { 
          phase: 'Active' 
        }
      },
      { 
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { 
          name: 'staging',
          uid: 'abc123-def456-ghi793',
          creationTimestamp: '2024-01-01T00:00:00Z',
          resourceVersion: '1004'
        },
        spec: {
          finalizers: ['kubernetes']
        },
        status: { 
          phase: 'Active' 
        }
      },
      { 
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { 
          name: 'production',
          uid: 'abc123-def456-ghi794',
          creationTimestamp: '2024-01-01T00:00:00Z',
          resourceVersion: '1005'
        },
        spec: {
          finalizers: ['kubernetes']
        },
        status: { 
          phase: 'Active' 
        }
      }
    ]
  });
});

// Mock pods for a namespace - Following real Kubernetes API v1.Pod schema
app.get('/api/v1/namespaces/:namespace/pods', (req, res) => {
  const { namespace } = req.params;
  res.json({
    apiVersion: 'v1',
    kind: 'PodList',
    metadata: {
      resourceVersion: '23456'
    },
    items: [
      { 
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { 
          name: `${namespace}-app-deployment-1`, 
          namespace,
          uid: '12345-67890-abcde',
          creationTimestamp: '2024-01-01T10:00:00Z',
          resourceVersion: '2000',
          labels: {
            app: 'app-deployment',
            version: 'v1'
          }
        },
        spec: {
          nodeName: 'worker-node-1',
          containers: [
            {
              name: 'app-container',
              image: 'nginx:1.21',
              ports: [{ containerPort: 80 }]
            }
          ]
        },
        status: { 
          phase: 'Running',
          podIP: '10.244.1.10',
          startTime: '2024-01-01T10:00:00Z'
        }
      },
      { 
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { 
          name: `${namespace}-api-deployment-1`, 
          namespace,
          uid: '12345-67890-abcdf',
          creationTimestamp: '2024-01-01T10:05:00Z',
          resourceVersion: '2001',
          labels: {
            app: 'api-deployment',
            version: 'v1'
          }
        },
        spec: {
          nodeName: 'worker-node-2',
          containers: [
            {
              name: 'api-container',
              image: 'node:18-alpine',
              ports: [{ containerPort: 3000 }]
            }
          ]
        },
        status: { 
          phase: 'Running',
          podIP: '10.244.2.10',
          startTime: '2024-01-01T10:05:00Z'
        }
      },
      { 
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { 
          name: `${namespace}-worker-deployment-1`, 
          namespace,
          uid: '12345-67890-abcdg',
          creationTimestamp: '2024-01-01T10:10:00Z',
          resourceVersion: '2002',
          labels: {
            app: 'worker-deployment',
            version: 'v1'
          }
        },
        spec: {
          nodeName: 'worker-node-1',
          containers: [
            {
              name: 'worker-container',
              image: 'python:3.9-slim'
            }
          ]
        },
        status: { 
          phase: 'Running',
          podIP: '10.244.1.11',
          startTime: '2024-01-01T10:10:00Z'
        }
      },
      { 
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { 
          name: `${namespace}-nginx-1`, 
          namespace,
          uid: '12345-67890-abcdh',
          creationTimestamp: '2024-01-01T10:15:00Z',
          resourceVersion: '2003',
          labels: {
            app: 'nginx',
            version: 'v1'
          }
        },
        spec: {
          nodeName: 'worker-node-3',
          containers: [
            {
              name: 'nginx-container',
              image: 'nginx:latest',
              ports: [{ containerPort: 80 }]
            }
          ]
        },
        status: { 
          phase: 'Running',
          podIP: '10.244.3.10',
          startTime: '2024-01-01T10:15:00Z'
        }
      }
    ]
  });
});

// Mock pod logs with streaming
app.get('/api/v1/namespaces/:namespace/pods/:pod/log', (req, res) => {
  const { namespace, pod } = req.params;
  const follow = req.query.follow === 'true';
  const sinceSeconds = req.query.sinceSeconds ? parseInt(req.query.sinceSeconds, 10) : null;
  
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  if (follow) {
    // Streaming mode
    let lineCount = 1;
    
    // Calculate start time based on sinceSeconds
    const now = new Date();
    const startTime = sinceSeconds ? new Date(now.getTime() - (sinceSeconds * 1000)) : new Date(now.getTime() - 300000); // Default to 5 minutes ago
    
    // Send initial log lines with timestamps
    const initialLines = [
      `${startTime.toISOString()} [INFO] Starting ${pod} in namespace ${namespace}`,
      `${new Date(startTime.getTime() + 1000).toISOString()} [INFO] Configuration loaded successfully`,
      `${new Date(startTime.getTime() + 2000).toISOString()} [INFO] Database connection established`,
      `${new Date(startTime.getTime() + 3000).toISOString()} [INFO] Server listening on port 3000`,
      `${new Date(startTime.getTime() + 4000).toISOString()} [INFO] Application started successfully`,
    ];
    
    initialLines.forEach(line => {
      res.write(line + '\n');
    });
    
    // Send new log lines every 2-5 seconds
    const interval = setInterval(() => {
      const logTypes = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
      const messages = [
        'Processing incoming request',
        'Database query executed',
        'Cache hit for key',
        'User authentication successful',
        'API call completed',
        'Background job started',
        'Configuration updated',
        'Health check passed',
        'Memory usage: 45%',
        'CPU usage: 12%'
      ];
      
      const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const timestamp = new Date().toISOString();
      
      res.write(`${timestamp} [${logType}] ${message} (line ${lineCount++})\n`);
    }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds
    
    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
    
    req.on('abort', () => {
      clearInterval(interval);
    });
    
  } else {
    // Static mode - return some recent logs
    const logs = [
      `${new Date().toISOString()} [INFO] Recent log entry 1`,
      `${new Date().toISOString()} [INFO] Recent log entry 2`,
      `${new Date().toISOString()} [WARN] Recent warning message`,
      `${new Date().toISOString()} [INFO] Recent log entry 3`,
    ];
    
    res.send(logs.join('\n'));
  }
});

app.listen(port, () => {
  console.log(`Mock Kubernetes API server running at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET /api/v1/namespaces');
  console.log('  GET /api/v1/namespaces/:namespace/pods');
  console.log('  GET /api/v1/namespaces/:namespace/pods/:pod/log');
});
