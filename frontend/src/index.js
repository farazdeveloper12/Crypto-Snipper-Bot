import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // You might have this line
import App from './App';
import patchReact from './StyleObjectFixer'; // Add this line
// Add this line to activate the fix
patchReact();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);