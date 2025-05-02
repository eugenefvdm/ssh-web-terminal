// app.js
// Socket class are related to the node server
// XTerm.js is related to the browser

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const hostInput = document.getElementById('host');
  const portInput = document.getElementById('port');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const statusMessage = document.getElementById('status-message');
  const connectionForm = document.getElementById('connection-form');
  const terminalSection = document.getElementById('terminal-section');
  const terminalContainer = document.getElementById('terminal-container');

  // Initialize Socket.io with explicit configuration
  const socket = io('http://localhost:3000', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    path: '/socket.io'
  });

  // Initialize XTerm.js
  const terminal = new Terminal({
    cursorBlink: true,
    theme: {
      background: '#000000',
      foreground: '#ffffff'
    },
    fontSize: 13,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    rows: 30,
    cols: 80,
    scrollback: 1000,
    convertEol: true,
    cursorStyle: 'block',
    termProgram: 'xterm-256color',
    termName: 'xterm-256color'    
  });

  // Add the fit addon
  // const fitAddon = new FitAddon();
  // terminal.loadAddon(fitAddon);

  // Create and initialize helper textarea
  const textarea = document.createElement('textarea');

  textarea.className = 'xterm-helper-textarea';
  textarea.setAttribute('aria-label', 'Terminal input');
  textarea.setAttribute('aria-multiline', 'false');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocapitalize', 'off');
  textarea.setAttribute('spellcheck', 'false');
  textarea.setAttribute('tabindex', '0');
  terminalContainer.appendChild(textarea);

  // Handle textarea focus
  textarea.addEventListener('focus', () => {
    terminal.focus();
  });

  // Handle textarea input
  textarea.addEventListener('input', () => {
    const data = textarea.value;
    terminal.write(data);
    textarea.value = '';
    socket.emit('terminal-input', data);
  });

  // Handle textarea keydown
  textarea.addEventListener('keydown', (e) => {
    let data = '';

    if (data) {
      e.preventDefault();
      terminal.write(data);
      socket.emit('terminal-input', data);
    }
  });

  // Handle terminal container click
  terminalContainer.addEventListener('click', () => {
    textarea.focus();
  });

  // Handle context menu and text selection
  terminalContainer.addEventListener('contextmenu', (e) => {
    console.log("Right click detected");
    e.preventDefault(); // Prevent default context menu
    const selection = window.getSelection();
    if (selection.toString()) {
      // If there's selected text, allow the default context menu
      return true;
    }
  });

  // Enable text selection in terminal
  terminal.attachCustomKeyEventHandler((e) => {
    // Allow Cmd+C (Mac) and Ctrl+C (Windows/Linux) for copying
    if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
      return true;
    }
    // Allow Cmd+V (Mac) and Ctrl+V (Windows/Linux) for pasting
    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
      return true;
    }
    return true;
  });

  // Safe resize function
  function safeResize() {
    try {
      if (terminalContainer.offsetWidth > 0 && terminalContainer.offsetHeight > 0) {
        const dimensions = {
          cols: Math.floor(terminalContainer.clientWidth / 8),
          rows: Math.floor(terminalContainer.clientHeight / 17)
        };
        terminal.resize(dimensions.cols, dimensions.rows);
        socket.emit('terminal-resize', dimensions);        
      }
    } catch (error) {
      console.error('Error resizing terminal:', error);
    }
  }

  // Function to show status message below the input fields
  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = `status ${isError ? 'error' : 'success'}`;
    statusMessage.classList.remove('hidden');
  }

  // Function to hide status message below the input fields
  function hideStatus() {
    statusMessage.classList.add('hidden');
  }

  // Function to handle connection
  function connect() {
    console.log('Attempting to connect to SSH server');
    const host = hostInput.value.trim();
    const port = parseInt(portInput.value, 10);
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Validate input
    if (!host || !username || !password) {
      console.log('Connection attempt failed: Missing required fields');
      showStatus('Please fill in all required fields', true);
      return;
    }

    // Disable connect button
    connectBtn.disabled = true;
    showStatus('Connecting to SSH server...');

    // Send connection request to server
    socket.emit('connect-ssh', {
      host,
      port,
      username,
      password
    });
  }

  // Function to handle disconnection
  function disconnect() {
    console.log('Disconnecting from SSH server');
    socket.emit('disconnect-ssh');
    terminalSection.classList.add('hidden');
    connectionForm.classList.remove('hidden');
    connectBtn.disabled = false;
    terminal.clear();
    showStatus('Disconnected from SSH server');
  }

  // Initialize terminal
  terminal.open(terminalContainer);
  // safeResize();

  // Handle terminal input (typing)
  terminal.onData(data => {
    socket.emit('terminal-input', data);
  });

  // Socket.io event handlers
  socket.on('connect', () => {
    console.log('Connected to node server');
    showStatus('Connected to node server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    showStatus('Failed to connect to node server: ' + error.message, true);
    connectBtn.disabled = false;
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from node server');
    terminalSection.classList.add('hidden');
    connectionForm.classList.remove('hidden');
    connectBtn.disabled = false;
    showStatus('Disconnected from node server', true);
  });

  socket.on('terminal-output', (data) => {  
    terminal.write(data);
  });

  socket.on('status', (data) => {
    console.log('Status:', data.message);

    if (data.message === 'SSH connection established') {
      hideStatus();
      connectionForm.classList.add('hidden');
      terminalSection.classList.remove('hidden');
      terminal.clear();
      textarea.focus();
      safeResize();
    } else if (data.message.includes('closed') || data.message.includes('ended')) {
      terminalSection.classList.add('hidden');
      connectionForm.classList.remove('hidden');
      connectBtn.disabled = false;
      showStatus('Disconnected from SSH server');
    }
  });

  socket.on('error', (data) => {
    console.error('Error received from server:', data.message);
    showStatus(data.message, true);
    connectBtn.disabled = false;
  });

  // Event listeners
  connectBtn.addEventListener('click', connect);
  disconnectBtn.addEventListener('click', disconnect);

  // Handle form submission
  connectionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    connect();
  });
});