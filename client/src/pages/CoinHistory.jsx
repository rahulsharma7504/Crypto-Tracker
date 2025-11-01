import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Spin, Table } from 'antd';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/api';
import dayjs from 'dayjs';

export default function CoinHistory({ coinId, visible, onClose, coinName }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible || !coinId) return;
    let mounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/coins/history/${coinId}`);
        if (!mounted) return;
        // Expect array of documents with price and timestamp
        setHistory(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load history');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => (mounted = false);
  }, [visible, coinId]);

  const chartData = useMemo(() => {
    // Map history to { time, price }
    return history
      .slice()
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map((h) => ({
        time: dayjs(h.timestamp).format('HH:mm'),
        price: h.price,
      }));
  }, [history]);

  const columns = [
    { title: 'Time', dataIndex: 'timestamp', key: 'timestamp', render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: 'Price (USD)', dataIndex: 'price', key: 'price', render: (v) => `$${v?.toFixed(4) || '-'}` },
    { title: 'Market Cap', dataIndex: 'marketCap', key: 'marketCap', render: (v) => (v ? v.toLocaleString() : '-') },
    { title: '24h %', dataIndex: 'change24h', key: 'change24h', render: (v) => (v ? v.toFixed(2) + '%' : '-') },
  ];

  return (
    <Modal title={`${coinName || coinId} — History`} visible={visible} onCancel={onClose} footer={null} width={800}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#1890ff" dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 12 }}>
            <Table dataSource={history.slice().reverse()} columns={columns} rowKey={(r) => r._id || r.timestamp} pagination={{ pageSize: 6 }} />
          </div>
        </div>
      )}
    </Modal>
  );
}
