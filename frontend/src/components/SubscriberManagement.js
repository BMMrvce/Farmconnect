import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SubscriberManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [plots, setPlots] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [subscriberDialog, setSubscriberDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [createdSubscriber, setCreatedSubscriber] = useState(null);
  
  const [subscriberForm, setSubscriberForm] = useState({ name: '', email: '' });
  const [assignForm, setAssignForm] = useState({ subscriber_id: '', plot_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subscribersRes, plotsRes, subscriptionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/subscribers`),
        axios.get(`${API_URL}/api/plots`),
        axios.get(`${API_URL}/api/subscriptions`)
      ]);
      
      setSubscribers(subscribersRes.data);
      setPlots(plotsRes.data);
      setSubscriptions(subscriptionsRes.data);
    } catch (error) {
      showError('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleCreateSubscriber = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/subscribers`, subscriberForm);
      setCreatedSubscriber(response.data);
      showSuccess(`Subscriber created! Email: ${response.data.email}, Password: ${response.data.default_password}`);
      setSubscriberDialog(false);
      setSubscriberForm({ name: '', email: '' });
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to create subscriber');
    }
  };

  const handleDeleteSubscriber = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscriber? This will remove all their subscriptions.')) {
      try {
        await axios.delete(`${API_URL}/api/subscribers/${id}`);
        showSuccess('Subscriber deleted successfully');
        fetchData();
      } catch (error) {
        showError('Failed to delete subscriber');
      }
    }
  };

  const handleAssignSubscriber = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/subscriptions/assign?plot_id=${assignForm.plot_id}&subscriber_id=${assignForm.subscriber_id}`);
      showSuccess('Subscriber assigned to plot successfully');
      setAssignDialog(false);
      setAssignForm({ subscriber_id: '', plot_id: '' });
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to assign subscriber');
    }
  };

  const handleRemoveSubscription = async (subscriptionId) => {
    if (window.confirm('Remove this subscriber from the plot?')) {
      try {
        await axios.delete(`${API_URL}/api/subscriptions/${subscriptionId}`);
        showSuccess('Subscription removed successfully');
        fetchData();
      } catch (error) {
        showError('Failed to remove subscription');
      }
    }
  };

  const getSubscriberName = (subscriberId) => {
    const subscriber = subscribers.find(s => s.id === subscriberId);
    return subscriber ? subscriber.name : 'Unknown';
  };

  const getPlotName = (plotId) => {
    const plot = plots.find(p => p.id === plotId);
    return plot ? plot.name : 'Unknown';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {createdSubscriber && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="font-semibold mb-1">Subscriber Account Created:</div>
            <div>Email: <strong>{createdSubscriber.email}</strong></div>
            <div>Default Password: <strong>{createdSubscriber.default_password}</strong></div>
            <div className="text-sm mt-2">Please share these credentials with the subscriber. They will be required to reset the password on first login.</div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Subscriber Management</CardTitle>
              <CardDescription>Create and manage subscriber accounts</CardDescription>
            </div>
            <Dialog open={subscriberDialog} onOpenChange={setSubscriberDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subscriber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subscriber</DialogTitle>
                  <DialogDescription>
                    Email will be auto-generated as subscribername@farm.com if not provided. Default password is 12345678.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubscriber} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Subscriber Name *</Label>
                    <Input
                      id="name"
                      value={subscriberForm.name}
                      onChange={(e) => setSubscriberForm({...subscriberForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={subscriberForm.email}
                      onChange={(e) => setSubscriberForm({...subscriberForm, email: e.target.value})}
                      placeholder="Leave empty for auto-generated email"
                    />
                  </div>
                  <Button type="submit" className="w-full">Create Subscriber</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No subscribers yet. Create your first subscriber account.
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map(subscriber => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.name}</TableCell>
                    <TableCell>{subscriber.email}</TableCell>
                    <TableCell>{new Date(subscriber.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSubscriber(subscriber.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Plot Subscriptions</CardTitle>
              <CardDescription>Assign subscribers to plots</CardDescription>
            </div>
            <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
              <DialogTrigger asChild>
                <Button disabled={subscribers.length === 0 || plots.length === 0}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign to Plot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Subscriber to Plot</DialogTitle>
                  <DialogDescription>
                    Select a subscriber and plot to create a subscription
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAssignSubscriber} className="space-y-4">
                  <div>
                    <Label htmlFor="subscriber">Subscriber</Label>
                    <Select
                      value={assignForm.subscriber_id}
                      onValueChange={(value) => setAssignForm({...assignForm, subscriber_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subscriber" />
                      </SelectTrigger>
                      <SelectContent>
                        {subscribers.map(subscriber => (
                          <SelectItem key={subscriber.id} value={subscriber.id}>
                            {subscriber.name} ({subscriber.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="plot">Plot</Label>
                    <Select
                      value={assignForm.plot_id}
                      onValueChange={(value) => setAssignForm({...assignForm, plot_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plot" />
                      </SelectTrigger>
                      <SelectContent>
                        {plots.map(plot => (
                          <SelectItem key={plot.id} value={plot.id}>
                            {plot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Assign Subscriber</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber</TableHead>
                <TableHead>Plot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No subscriptions yet. Assign subscribers to plots.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map(subscription => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{getSubscriberName(subscription.subscriber_id)}</TableCell>
                    <TableCell>{getPlotName(subscription.plot_id)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subscription.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveSubscription(subscription.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriberManagement;
