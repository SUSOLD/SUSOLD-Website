import React, { useState } from 'react';
import api from '../services/apiService';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const StatsPanel = ({ onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [showChart, setShowChart] = useState(false);

  const fetchStats = async () => {
    try {
      const [summaryRes, invoicesRes] = await Promise.all([
        api.get('/home/sales-summary', {
          params: { start_date: startDate, end_date: endDate }
        }),
        api.get('/home/invoices', {
          params: { start_date: startDate, end_date: endDate }
        })
      ]);

      setStats(summaryRes.data);
      setInvoices(invoicesRes.data.invoices);

      const statsByDay = {};
      invoicesRes.data.invoices.forEach((inv) => {
        const day = inv.date.split('T')[0];
        if (!statsByDay[day]) {
          statsByDay[day] = { date: day, revenue: 0, cost: 0, profit: 0 };
        }
        const cost = inv.total_price * 0.5;
        const profit = inv.total_price - cost;
        statsByDay[day].revenue += inv.total_price;
        statsByDay[day].cost += cost;
        statsByDay[day].profit += profit;
      });
      setDailyStats(Object.values(statsByDay));
    } catch (error) {
      alert('Failed to fetch statistics or invoices.');
      console.error(error);
    }
  };

  const downloadInvoicePDF = async (orderId) => {
    try {
      const res = await api.get(`/home/invoice-pdf/${orderId}`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed', error);
      alert('Invoice download failed.');
    }
  };

  return (
    <div style={styles.modal}>
      <h2>Sales Summary</h2>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={styles.input}
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={styles.input}
      />
      <div style={{ marginBottom: 10 }}>
        <button onClick={fetchStats} style={styles.button}>Get Stats</button>
        <button onClick={onClose} style={styles.button}>Close</button>
        <button onClick={() => setShowChart(!showChart)} style={styles.button}>Toggle Chart</button>
      </div>

      {stats && (
        <div>
          <p><b>Revenue:</b> {stats.total_revenue} TL</p>
          <p><b>Cost:</b> {stats.total_cost} TL</p>
          <p><b>Profit:</b> {stats.total_profit} TL</p>
        </div>
      )}

      {showChart && dailyStats.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
            <Line type="monotone" dataKey="cost" stroke="#82ca9d" name="Loss" />
            <Line type="monotone" dataKey="profit" stroke="#ffc658" name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      )}

      {invoices.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Invoices</h3>
          {invoices.map(inv => (
            <div key={inv.order_id} style={{ marginBottom: 10 }}>
              <p>🧾 <b>Order:</b> {inv.order_id} – {inv.total_price} TL</p>
              <button
                onClick={() => downloadInvoicePDF(inv.order_id)}
                style={styles.button}
              >
                Download PDF
              </button>
            </div>
          ))}
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
    zIndex: 1000,
    maxWidth: '400px'
  },
  input: {
    display: 'block',
    marginBottom: 10,
    padding: 5,
    width: '100%'
  },
  button: {
    marginRight: 10,
    marginTop: 5,
    padding: '5px 10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer'
  }
};

export default StatsPanel;
