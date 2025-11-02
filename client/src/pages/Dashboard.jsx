import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { Table, Input, Select, Button, Space, Spin, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/api';
import { useAuth } from '../context/AuthProvider';

const { Option } = Select;

function formatNumber(n) {
  if (n === undefined || n === null) return '-';
  return n.toLocaleString();
}

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export default function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [changeFilter, setChangeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('marketCap');
  const [selected, setSelected] = useState(null);
  const { logout } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/coins');
      setCoins(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleSearch = useCallback((e) => setQuery(e.target.value), []);
  const handleFilterChange = useCallback((value) => setChangeFilter(value), []);
  const handleSortChange = useCallback((value) => setSortBy(value), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = coins;
    if (q) {
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }
    if (changeFilter === 'positive') list = list.filter((c) => (c.price_change_percentage_24h || 0) > 0);
    if (changeFilter === 'negative') list = list.filter((c) => (c.price_change_percentage_24h || 0) < 0);

    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'marketCap') return (b.market_cap || 0) - (a.market_cap || 0);
      if (sortBy === 'price') return (b.current_price || 0) - (a.current_price || 0);
      if (sortBy === 'change24h') return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0);
      return 0;
    });
    return sorted;
  }, [coins, query, changeFilter, sortBy]);

const columns = useMemo(() => [
  {
    title: 'Coin',
    dataIndex: 'name',
    key: 'name',
    render: (_, record) => (
      <Space>
        <img src={record.image} alt={record.name} width={28} height={28} loading="lazy" />
        <div>
          <div style={{ fontWeight: 600 }}>{record.name}</div>
          <div style={{ color: '#666' }}>{record.symbol?.toUpperCase()}</div>
        </div>
      </Space>
    ),
  },
  {
    title: 'Price (USD)',
    key: 'price',
    align: 'right',
    render: (_, record) => `$${(record.price || record.current_price || 0).toLocaleString()}`,
  },
  {
    title: 'Market Cap',
    key: 'marketCap',
    align: 'right',
    render: (_, record) => `$${formatNumber(record.marketCap || record.market_cap)}`,
  },
  {
    title: '24h %',
    key: 'change24h',
    align: 'right',
    render: (_, record) => {
      const v = record.change24h ?? record.price_change_percentage_24h;
      return <span style={{ color: v >= 0 ? 'green' : 'red' }}>{v ? v.toFixed(2) + '%' : '-'}</span>;
    },
  },
  {
    title: 'Last Updated',
    key: 'lastUpdated',
    align: 'right',
    render: (_, record) => (
      record.lastUpdated
        ? dayjs(record.lastUpdated).format('YYYY-MM-DD HH:mm')
        : record.last_updated
          ? dayjs(record.last_updated).format('YYYY-MM-DD HH:mm')
          : '-'
    ),
  },
], []);


  return (
    <div style={{ padding: 20 }}>
      <Card>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Crypto Tracker — Top 10</h2>
            <div style={{ color: '#666', fontSize: 12 }}>Auto-refresh every 30 minutes</div>
          </div>

          <Space>
            <Input
              placeholder="Search by name or symbol"
              prefix={<SearchOutlined />}
              value={query}
              onChange={handleSearch}
              allowClear
              style={{ width: 240 }}
            />

            <Select value={changeFilter} onChange={handleFilterChange} style={{ width: 140 }}>
              <Option value="all">All changes</Option>
              <Option value="positive">Positive 24h</Option>
              <Option value="negative">Negative 24h</Option>
            </Select>

            <Select value={sortBy} onChange={handleSortChange} style={{ width: 160 }}>
              <Option value="marketCap">Sort: Market Cap (desc)</Option>
              <Option value="price">Sort: Price (desc)</Option>
              <Option value="change24h">Sort: 24h % (desc)</Option>
            </Select>

            <Button icon={<ReloadOutlined />} onClick={fetchData} />
            <Button onClick={logout}>Logout</Button>
          </Space>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey={(r) => r.id || r.coinId}
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: () => setSelected({ id: record.id || record.coinId, name: record.name }),
            })}
          />
        )}
      </Card>

      <Suspense fallback={null}>
        {selected && (
          <CoinHistory
            coinId={selected.id}
            coinName={selected.name}
            visible={!!selected}
            onClose={() => setSelected(null)}
          />
        )}
      </Suspense>
    </div>
  );
}

// Lazy load CoinHistory to reduce initial bundle
const CoinHistory = lazy(() => import('./CoinHistory'));
