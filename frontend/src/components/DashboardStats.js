import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tractor, Leaf, Package, AlertTriangle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="shadow-lg border-l-4" style={{ borderLeftColor: color }}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-[#5a7c3b]">{title}</CardTitle>
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-[#2d5016]">{value}</div>
    </CardContent>
  </Card>
);

const DashboardStats = () => {
  const [stats, setStats] = useState({
    total_farms: 0,
    total_plots: 0,
    active_plantings: 0,
    low_stock_items: 0,
    assigned_plots: 0,
    tasks_today: 0,
    active_subscriptions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-[#5a7c3b]">Loading statistics...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.total_farms !== undefined && (
        <StatCard title="Total Farms" value={stats.total_farms} icon={Tractor} color="#558b2f" />
      )}
      {stats.total_plots !== undefined && (
        <StatCard title="Total Plots" value={stats.total_plots} icon={Leaf} color="#7cb342" />
      )}
      {stats.active_plantings !== undefined && (
        <StatCard title="Active Plantings" value={stats.active_plantings} icon={Leaf} color="#8bc34a" />
      )}
      {stats.low_stock_items !== undefined && (
        <StatCard title="Low Stock Items" value={stats.low_stock_items} icon={AlertTriangle} color="#f57c00" />
      )}
      {stats.assigned_plots !== undefined && (
        <StatCard title="Assigned Plots" value={stats.assigned_plots} icon={Tractor} color="#558b2f" />
      )}
      {stats.tasks_today !== undefined && (
        <StatCard title="Tasks Today" value={stats.tasks_today} icon={Package} color="#7cb342" />
      )}
      {stats.active_subscriptions !== undefined && (
        <StatCard title="Active Subscriptions" value={stats.active_subscriptions} icon={Leaf} color="#8bc34a" />
      )}
    </div>
  );
};

export default DashboardStats;
