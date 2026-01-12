import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Send, CheckCircle } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    if (!file) return alert('Please select a CSV file first!');
    
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      setStatus('Uploading and queuing 1,842 emails...');
      const response = await axios.post('http://localhost:5000/api/upload', formData);
      setStatus(`Success: ${response.data.message}`);
    } catch (error) {
      setStatus('Error uploading file.');
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1 style={{ color: '#2563eb' }}>HR Mailer Dashboard</h1>
      <p>Upload your CSV to start the MERN pitch campaign.</p>
      
      <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '8px' }}>
        <input 
          type="file" 
          accept=".csv" 
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: '20px' }}
        />
        <br />
        <button 
          onClick={handleUpload}
          style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: 'auto' }}
        >
          <Send size={18} /> Start Sending
        </button>
      </div>

      {status && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={20} /> {status}
        </div>
      )}
    </div>
  );
}

export default App;