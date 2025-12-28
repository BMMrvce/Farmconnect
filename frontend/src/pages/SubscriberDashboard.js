import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import DashboardStats from '@/components/DashboardStats';
import PasswordResetPrompt from '@/components/PasswordResetPrompt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Leaf, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SubscriberDashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plots, setPlots] = useState([]);
  const [plantInstances, setPlantInstances] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, plotsRes, plantsRes] = await Promise.all([
        axios.get(`${API_URL}/api/subscriptions`),
        axios.get(`${API_URL}/api/plots`),
        axios.get(`${API_URL}/api/plants`)
      ]);
      setSubscriptions(subsRes.data);
      setPlots(plotsRes.data);
      setPlants(plantsRes.data);

      // Fetch plant instances for subscribed plots
      const plotIds = subsRes.data.map(sub => sub.plot_id);
      if (plotIds.length > 0) {
        const instancesRes = await axios.get(`${API_URL}/api/plant-instances`);
        const filteredInstances = instancesRes.data.filter(inst => plotIds.includes(inst.plot_id));
        setPlantInstances(filteredInstances);
      }
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e8]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-xl text-[#2d5016]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#e8f5e9] to-[#f1f8e9]">
      <Navbar />
      <PasswordResetPrompt />
      
      <div className="container mx-auto px-4 py-8">
        {success && (
          <Alert className="mb-6 border-[#8bc34a] bg-[#f1f8e9]">
            <CheckCircle className="h-4 w-4 text-[#558b2f]" />
            <AlertDescription className="text-[#2d5016]">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#2d5016] mb-2">Subscriber Dashboard</h1>
          <p className="text-[#5a7c3b]">View your plot subscriptions and plant growth</p>
        </div>

        <div className="mb-8">
          <DashboardStats />
        </div>

        {/* Subscriptions */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2d5016]">My Subscriptions</CardTitle>
            <CardDescription className="text-[#5a7c3b]">Plots you are subscribed to</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <Leaf className="w-16 h-16 text-[#8bc34a] mx-auto mb-4 opacity-50" />
                <p className="text-[#5a7c3b] text-lg">No active subscriptions yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#2d5016]">Plot Name</TableHead>
                    <TableHead className="text-[#2d5016]">Status</TableHead>
                    <TableHead className="text-[#2d5016]">Subscribed Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const plot = plots.find(p => p.id === sub.plot_id);
                    return (
                      <TableRow key={sub.id} data-testid={`subscription-row-${sub.id}`}>
                        <TableCell className="font-medium text-[#2d5016]">{plot?.name || 'Unknown Plot'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sub.status === 'active' ? 'bg-green-100 text-green-800' :
                            sub.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {sub.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#5a7c3b]">
                          {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Plant Growth Progress */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2d5016]">Plant Growth Progress</CardTitle>
            <CardDescription className="text-[#5a7c3b]">Track the growth of plants in your subscribed plots</CardDescription>
          </CardHeader>
          <CardContent>
            {plantInstances.length === 0 ? (
              <div className="text-center py-12">
                <Leaf className="w-16 h-16 text-[#8bc34a] mx-auto mb-4 opacity-50" />
                <p className="text-[#5a7c3b] text-lg">No plants growing in your subscribed plots yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#2d5016]">Plant</TableHead>
                    <TableHead className="text-[#2d5016]">Plot</TableHead>
                    <TableHead className="text-[#2d5016]">Planted On</TableHead>
                    <TableHead className="text-[#2d5016]">Growth Stage</TableHead>
                    <TableHead className="text-[#2d5016]">Days</TableHead>
                    <TableHead className="text-[#2d5016]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plantInstances.map((instance) => {
                    const plant = plants.find(p => p.id === instance.plant_id);
                    const plot = plots.find(p => p.id === instance.plot_id);
                    return (
                      <TableRow key={instance.id} data-testid={`plant-instance-row-${instance.id}`}>
                        <TableCell className="font-medium text-[#2d5016]">
                          <div className="flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-[#8bc34a]" />
                            {plant?.name || 'Unknown Plant'}
                          </div>
                        </TableCell>
                        <TableCell className="text-[#5a7c3b]">{plot?.name || '-'}</TableCell>
                        <TableCell className="text-[#5a7c3b]">{instance.planted_on}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            instance.current_growth_stage === 'germination' ? 'bg-yellow-100 text-yellow-800' :
                            instance.current_growth_stage === 'vegetative' ? 'bg-green-100 text-green-800' :
                            instance.current_growth_stage === 'flowering' ? 'bg-pink-100 text-pink-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {instance.current_growth_stage || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#5a7c3b]">{instance.days_since_planting || '-'} days</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            instance.status === 'active' ? 'bg-green-100 text-green-800' :
                            instance.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {instance.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriberDashboard;
