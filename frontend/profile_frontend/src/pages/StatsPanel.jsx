import React, { useState } from 'react';
import api from '../services/apiService';

const StatsPanel = ({ onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
        const res = await api.get('/home/sales-summary', {
        params: {
            start_date: startDate,
            end_date: endDate
        }
        });
        setStats(res.data);
    } catch (error) {
        alert('Failed to fetch statistics.');
        console.error(error);
    }
    };


  return (
    <div style={styles.modal}>
      <h2>Sales Summary</h2>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} />
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.input} />
      <div style={{ marginBottom: 10 }}>
        <button onClick={fetchStats} style={styles.button}>Get Stats</button>
        <button onClick={onClose} style={styles.button}>Close</button>
      </div>
      {stats && (
        <div>
          <p><b>Revenue:</b> {stats.total_revenue} TL</p>
          <p><b>Cost:</b> {stats.total_cost} TL</p>
          <p><b>Profit:</b> {stats.total_profit} TL</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  modal: {
    position: 'fixed',
    top: 100,
    right: 50,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    border: '1px solid gray',
    zIndex: 1000
  },
  input: {
    display: 'block',
    marginBottom: 10,
    padding: 5,
    width: '100%'
  },
  button: {
    marginRight: 10,
    padding: '5px 10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer'
  }
};

export default StatsPanel;
