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

const FarmerManagement = () => {
  const [farmers, setFarmers] = useState([]);
  const [plots, setPlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [farmerDialog, setFarmerDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [createdFarmer, setCreatedFarmer] = useState(null);
  
  const [farmerForm, setFarmerForm] = useState({ name: '', email: '' });
  const [assignForm, setAssignForm] = useState({ farmer_id: '', plot_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [farmersRes, plotsRes, assignmentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/farmers`),
        axios.get(`${API_URL}/api/plots`),
        axios.get(`${API_URL}/api/farmer-assignments`)
      ]);
      
      setFarmers(farmersRes.data);
      setPlots(plotsRes.data);
      setAssignments(assignmentsRes.data);
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

  const handleCreateFarmer = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/farmers`, farmerForm);
      setCreatedFarmer(response.data);
      showSuccess(`Farmer created! Email: ${response.data.email}, Password: ${response.data.default_password}`);
      setFarmerDialog(false);
      setFarmerForm({ name: '', email: '' });
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to create farmer');
    }
  };

  const handleDeleteFarmer = async (id) => {
    if (window.confirm('Are you sure you want to delete this farmer? This will remove all their plot assignments.')) {
      try {
        await axios.delete(`${API_URL}/api/farmers/${id}`);
        showSuccess('Farmer deleted successfully');
        fetchData();
      } catch (error) {
        showError('Failed to delete farmer');
      }
    }
  };

  const handleAssignFarmer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/farmer-assignments`, assignForm);
      showSuccess('Farmer assigned to plot successfully');
      setAssignDialog(false);
      setAssignForm({ farmer_id: '', plot_id: '' });
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to assign farmer');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (window.confirm('Remove this farmer from the plot?')) {
      try {
        await axios.delete(`${API_URL}/api/farmer-assignments/${assignmentId}`);
        showSuccess('Assignment removed successfully');
        fetchData();
      } catch (error) {
        showError('Failed to remove assignment');
      }
    }
  };

  const getFarmerName = (farmerId) => {
    const farmer = farmers.find(f => f.id === farmerId);
    return farmer ? farmer.name : 'Unknown';
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

      {createdFarmer && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="font-semibold mb-1">Farmer Account Created:</div>
            <div>Email: <strong>{createdFarmer.email}</strong></div>
            <div>Default Password: <strong>{createdFarmer.default_password}</strong></div>
            <div className="text-sm mt-2">Please share these credentials with the farmer. They will be required to reset the password on first login.</div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Farmer Management</CardTitle>
              <CardDescription>Create and manage farmer accounts</CardDescription>
            </div>
            <Dialog open={farmerDialog} onOpenChange={setFarmerDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Farmer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Farmer</DialogTitle>
                  <DialogDescription>
                    Email will be auto-generated as farmername@farm.com if not provided. Default password is 12345678.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateFarmer} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Farmer Name *</Label>
                    <Input
                      id="name"
                      value={farmerForm.name}
                      onChange={(e) => setFarmerForm({...farmerForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={farmerForm.email}
                      onChange={(e) => setFarmerForm({...farmerForm, email: e.target.value})}
                      placeholder="Leave empty for auto-generated email"
                    />
                  </div>
                  <Button type="submit" className="w-full">Create Farmer</Button>
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
              {farmers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No farmers yet. Create your first farmer account.
                  </TableCell>
                </TableRow>
              ) : (
                farmers.map(farmer => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>{farmer.email}</TableCell>
                    <TableCell>{new Date(farmer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFarmer(farmer.id)}
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
              <CardTitle>Plot Assignments</CardTitle>
              <CardDescription>Assign farmers to plots</CardDescription>
            </div>
            <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
              <DialogTrigger asChild>
                <Button disabled={farmers.length === 0 || plots.length === 0}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign to Plot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Farmer to Plot</DialogTitle>
                  <DialogDescription>
                    Select a farmer and plot to create an assignment
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAssignFarmer} className="space-y-4">
                  <div>
                    <Label htmlFor="farmer">Farmer</Label>
                    <Select
                      value={assignForm.farmer_id}
                      onValueChange={(value) => setAssignForm({...assignForm, farmer_id: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select farmer" />
                      </SelectTrigger>
                      <SelectContent>
                        {farmers.map(farmer => (
                          <SelectItem key={farmer.id} value={farmer.id}>
                            {farmer.name} ({farmer.email})
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
                  <Button type="submit" className="w-full">Assign Farmer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer</TableHead>
                <TableHead>Plot</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No assignments yet. Assign farmers to plots.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{getFarmerName(assignment.farmer_id)}</TableCell>
                    <TableCell>{getPlotName(assignment.plot_id)}</TableCell>
                    <TableCell>{new Date(assignment.assigned_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.id)}
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

export default FarmerManagement;
