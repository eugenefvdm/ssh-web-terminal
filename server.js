// project structure:
// - server.js (main server file)
// - package.json (dependencies)
// - src/ (client-side code)
// - index.html (web interface)

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Client } from 'ssh2';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Configure MIME types
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// Serve static files
app.use(express.static(join(__dirname, 'dist')));
app.use(express.json());

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let sshClient = null;
  let isConnecting = false;
  let isConnected = false;
  let currentStream = null;

  // Helper function to cleanup connection
  const cleanupConnection = () => {
    if (currentStream) {
      currentStream.removeAllListeners();
      currentStream = null;
    }
    if (sshClient) {
      sshClient.removeAllListeners();
      sshClient.end();
      sshClient = null;
    }
    isConnecting = false;
    isConnected = false;
  };

  // Handle connection request from client
  socket.on('connect-ssh', (credentials) => {
    if (isConnecting || isConnected) {
      console.log('Connection already in progress or established');
      socket.emit('error', { message: 'Connection already in progress or established' });
      return;
    }

    console.log(`Connection attempt from client ${socket.id} to ${credentials.host}:${credentials.port || 22}`);
    
    isConnecting = true;
    // Create a new SSH client
    sshClient = new Client();

    // Handle SSH client events
    sshClient.on('ready', () => {
      console.log('SSH connection ready');
      isConnecting = false;
      isConnected = true;
      socket.emit('status', { message: 'SSH connection established' });
      
      // Create a new shell session
      sshClient.shell((err, stream) => {
        if (err) {
          console.error('Shell error:', err);
          socket.emit('error', { message: `Shell error: ${err.message}` });
          cleanupConnection();
          return;
        }

        console.log('Shell session created');
        currentStream = stream;

        // Forward data from SSH server to client
        stream.on('data', (data) => {
          socket.emit('terminal-output', data.toString('utf-8'));
        });

        stream.on('close', () => {
          console.log('Shell session closed');
          socket.emit('status', { message: 'SSH connection closed' });
          cleanupConnection();
        });

        // Forward input from client to SSH server
        socket.on('terminal-input', (data) => {
          if (stream && isConnected) {
            stream.write(data);
          }
        });

        // Handle terminal resize
        socket.on('terminal-resize', ({ cols, rows }) => {
          if (stream && isConnected) {
            stream.setWindow(rows, cols, 0, 0);
          }
        });
      });
    });

    sshClient.on('error', (err) => {
      console.error('SSH error:', err);
      socket.emit('error', { message: `SSH connection error: ${err.message}` });
      cleanupConnection();
    });

    sshClient.on('end', () => {
      console.log('SSH connection ended');
      socket.emit('status', { message: 'SSH connection ended' });
      cleanupConnection();
    });

    sshClient.on('close', () => {
      console.log('SSH connection closed');
      socket.emit('status', { message: 'SSH connection closed' });
      cleanupConnection();
    });

    // Attempt to connect
    try {
      console.log('Attempting SSH connection with credentials:', {
        host: credentials.host,
        port: credentials.port || 22,
        username: credentials.username,
      });
      
      sshClient.connect({
        host: credentials.host,
        port: credentials.port || 22,
        username: credentials.username,
        password: credentials.password,
      });
    } catch (err) {
      console.error('SSH connection error:', err);
      socket.emit('error', { message: `Connection attempt failed: ${err.message}` });
      cleanupConnection();
    }
  });

  // Handle disconnection
  socket.on('disconnect-ssh', () => {
    console.log('Client requested SSH disconnect');
    cleanupConnection();
  });

  // Handle browser disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    cleanupConnection();
  });
});

// Set the server to listen on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('=================================');
  console.log(`SSH Web Terminal server started`);
  console.log(`Listening on port ${PORT}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('=================================');
}); 