import React from 'react';
import AppRouter from './routes/AppRouter';
import './styles/main.css'; 
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <AppRouter />
    </div>
  );
}

export default App;
