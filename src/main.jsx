import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Create root once
const root = ReactDOM.createRoot(document.getElementById('root'));

// Initial render
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enable HMR (Hot Module Replacement)
if (import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    // When App.jsx is updated, this callback will be triggered
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
}
