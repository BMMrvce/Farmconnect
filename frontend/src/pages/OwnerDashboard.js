import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import DashboardStats from '@/components/DashboardStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Package, Leaf, Tractor, CheckCircle, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const OwnerDashboard = () => {
  const [farms, setFarms] = useState([]);
  const [plots, setPlots] = useState([]);
  const [plants, setPlants] = useState([]);
  const [plantInstances, setPlantInstances] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [growthCycles, setGrowthCycles] = useState([]);
  const [plantRequirements, setPlantRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [farmDialog, setFarmDialog] = useState(false);
  const [plotDialog, setPlotDialog] = useState(false);
  const [plantDialog, setPlantDialog] = useState(false);
  const [instanceDialog, setInstanceDialog] = useState(false);
  const [inventoryDialog, setInventoryDialog] = useState(false);
  const [cycleDialog, setCycleDialog] = useState(false);
  const [requirementDialog, setRequirementDialog] = useState(false);

  const [farmForm, setFarmForm] = useState({ name: '', location: '', description: '' });
  const [plotForm, setPlotForm] = useState({ farm_id: '', name: '', area_sqm: '', soil_type: '' });
  const [plantForm, setPlantForm] = useState({ name: '', scientific_name: '', requirement_id: '', growth_cycle_id: '', notes: '' });
  const [instanceForm, setInstanceForm] = useState({ plot_id: '', plant_id: '', planted_on: '', count: 1 });
  const [inventoryForm, setInventoryForm] = useState({ name: '', unit: '', quantity: 0, reorder_level: 0 });
  const [cycleForm, setCycleForm] = useState({ germination_days: 0, vegetative_days: 0, flowering_days: 0, fruiting_days: 0, total_growth_days: 0 });
  const [requirementForm, setRequirementForm] = useState({
    water_min_ml: 0, water_max_ml: 0,
    panchagavya_l_per_month: 0, dashagavya_l_per_month: 0, jeevamrutha_l_per_month: 0,
    go_krupa_ml_weekly: 0, vermicompost_ml_monthly: 0, cowpat_kg_monthly: 0,
    spray_3g_g_monthly: 0, mustard_g_monthly: 0, pulse_l_monthly: 0,
    buttermilk_ml_monthly: 0, bo_ml_monthly: 0, faa_ml_monthly: 0, em_ml_monthly: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [farmsRes, plotsRes, plantsRes, inventoryRes, cyclesRes, requirementsRes] = await Promise.all([
        axios.get(`${API_URL}/api/farms`),
        axios.get(`${API_URL}/api/plots`),
        axios.get(`${API_URL}/api/plants`),
        axios.get(`${API_URL}/api/inventory`),
        axios.get(`${API_URL}/api/growth-cycles`),
        axios.get(`${API_URL}/api/plant-requirements`)
      ]);
      setFarms(farmsRes.data);
      setPlots(plotsRes.data);
      setPlants(plantsRes.data);
      setInventory(inventoryRes.data);
      setGrowthCycles(cyclesRes.data);
      setPlantRequirements(requirementsRes.data);
    } catch (error) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantInstances = async (plotId = '') => {
    try {
      const url = plotId ? `${API_URL}/api/plant-instances?plot_id=${plotId}` : `${API_URL}/api/plant-instances`;
      const response = await axios.get(url);
      setPlantInstances(response.data);
    } catch (error) {
      console.error('Failed to fetch plant instances:', error);
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  // Farm Management
  const handleCreateFarm = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/farms`, farmForm);
      showSuccess('Farm created successfully');
      setFarmDialog(false);
      setFarmForm({ name: '', location: '', description: '' });
      fetchAllData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to create farm');
    }
  };

  const handleDeleteFarm = async (id) => {
    if (window.confirm('Are you sure? This will delete all plots and plant instances.')) {
      try {
        await axios.delete(`${API_URL}/api/farms/${id}`);
        showSuccess('Farm deleted successfully');
        fetchAllData();
      } catch (error) {
        showError('Failed to delete farm');
      }
    }
  };

  // Plot Management
  const handleCreatePlot = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/plots`, plotForm);
      showSuccess('Plot created successfully');
      setPlotDialog(false);
      setPlotForm({ farm_id: '', name: '', area_sqm: '', soil_type: '' });
      fetchAllData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to create plot');
    }
  };

  const handleDeletePlot = async (id) => {
    if (window.confirm('Are you sure? This will delete all plant instances.')) {
      try {
        await axios.delete(`${API_URL}/api/plots/${id}`);
        showSuccess('Plot deleted successfully');
        fetchAllData();
      } catch (error) {
        showError('Failed to delete plot');
      }
    }
  };

  // Plant Management
  const handleCreatePlant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/plants`, plantForm);
      showSuccess('Plant created successfully');
      setPlantDialog(false);
      setPlantForm({ name: '', scientific_name: '', requirement_id: '', growth_cycle_id: '', notes: '' });
      fetchAllData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to create plant');
    }
  };

  // Plant Instance Management
  const handleCreateInstance = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/plant-instances`, instanceForm);
      showSuccess('Plant instance created and schedules generated');
      setInstanceDialog(false);
      setInstanceForm({ plot_id: '', plant_id: '', planted_on: '', count: 1 });
      fetchPlantInstances();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to create plant instance');
    }
  };

  // Inventory Management
  const handleCreateInventory = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/inventory`, inventoryForm);
      showSuccess('Inventory item added successfully');
      setInventoryDialog(false);
      setInventoryForm({ name: '', unit: '', quantity: 0, reorder_level: 0 });
      fetchAllData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to add inventory');
    }
  };

  const handleUpdateInventory = async (id, quantity, reason) => {
    try {
      await axios.put(`${API_URL}/api/inventory/${id}`, null, {
        params: { quantity, reason }
      });
      showSuccess('Inventory updated successfully');
      fetchAllData();
    } catch (error) {
      showError('Failed to update inventory');
    }
  };

  // Growth Cycle Management
  const handleCreateCycle = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/growth-cycles`, cycleForm);
      showSuccess('Growth cycle created successfully');
      setCycleDialog(false);
      setCycleForm({ germination_days: 0, vegetative_days: 0, flowering_days: 0, fruiting_days: 0, total_growth_days: 0 });
      fetchAllData();
    } catch (error) {
      showError('Failed to create growth cycle');
    }
  };

  // Requirement Management
  const handleCreateRequirement = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/plant-requirements`, requirementForm);
      showSuccess('Plant requirements created successfully');
      setRequirementDialog(false);
      setRequirementForm({
        water_min_ml: 0, water_max_ml: 0,
        panchagavya_l_per_month: 0, dashagavya_l_per_month: 0, jeevamrutha_l_per_month: 0,
        go_krupa_ml_weekly: 0, vermicompost_ml_monthly: 0, cowpat_kg_monthly: 0,
        spray_3g_g_monthly: 0, mustard_g_monthly: 0, pulse_l_monthly: 0,
        buttermilk_ml_monthly: 0, bo_ml_monthly: 0, faa_ml_monthly: 0, em_ml_monthly: 0
      });
      fetchAllData();
    } catch (error) {
      showError('Failed to create requirements');
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
          <h1 className="text-4xl font-bold text-[#2d5016] mb-2">Farm Owner Dashboard</h1>
          <p className="text-[#5a7c3b]">Manage your farms, plots, plants, and inventory</p>
        </div>

        <div className="mb-8">
          <DashboardStats />
        </div>

        <Tabs defaultValue="farms" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-white/50 backdrop-blur-sm border border-[#8bc34a]/20">
            <TabsTrigger value="farms" data-testid="farms-tab" className="data-[state=active]:bg-[#558b2f] data-[state=active]:text-white">Farms</TabsTrigger>
            <TabsTrigger value="plots" data-testid="plots-tab" className="data-[state=active]:bg-[#558b2f] data-[state=active]:text-white">Plots</TabsTrigger>
            <TabsTrigger value="plants" data-testid="plants-tab" className="data-[state=active]:bg-[#558b2f] data-[state=active]:text-white">Plants</TabsTrigger>
            <TabsTrigger value="instances" data-testid="instances-tab" className="data-[state=active]:bg-[#558b2f] data-[state=active]:text-white">Plant Instances</TabsTrigger>
            <TabsTrigger value="inventory" data-testid="inventory-tab" className="data-[state=active]:bg-[#558b2f] data-[state=active]:text-white">Inventory</TabsTrigger>
            <TabsTrigger value="setup" data-testid="setup-tab" className="data-[state=active]:bg-[#558b2f] data-[state=active]:text-white">Setup</TabsTrigger>
          </TabsList>

          {/* FARMS TAB */}
          <TabsContent value="farms">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl text-[#2d5016]">Farms</CardTitle>
                    <CardDescription className="text-[#5a7c3b]">Manage your farm properties</CardDescription>
                  </div>
                  <Dialog open={farmDialog} onOpenChange={setFarmDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-farm-button" className="bg-[#558b2f] hover:bg-[#33691e]">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Farm
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-[#2d5016]">Create New Farm</DialogTitle>
                        <DialogDescription className="text-[#5a7c3b]">Add a new farm to your management system</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateFarm} className="space-y-4">
                        <div>
                          <Label htmlFor="farm-name" className="text-[#2d5016]">Farm Name *</Label>
                          <Input
                            id="farm-name"
                            data-testid="farm-name-input"
                            value={farmForm.name}
                            onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                            required
                            placeholder="Green Acres Farm"
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <div>
                          <Label htmlFor="farm-location" className="text-[#2d5016]">Location</Label>
                          <Input
                            id="farm-location"
                            value={farmForm.location}
                            onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
                            placeholder="Maharashtra, India"
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <div>
                          <Label htmlFor="farm-description" className="text-[#2d5016]">Description</Label>
                          <Textarea
                            id="farm-description"
                            value={farmForm.description}
                            onChange={(e) => setFarmForm({ ...farmForm, description: e.target.value })}
                            placeholder="Organic vegetable farm..."
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <Button type="submit" data-testid="submit-farm-button" className="w-full bg-[#558b2f] hover:bg-[#33691e]">
                          Create Farm
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[#2d5016]">Name</TableHead>
                      <TableHead className="text-[#2d5016]">Location</TableHead>
                      <TableHead className="text-[#2d5016]">Description</TableHead>
                      <TableHead className="text-[#2d5016]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-[#5a7c3b] py-8">
                          No farms yet. Create your first farm to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      farms.map((farm) => (
                        <TableRow key={farm.id} data-testid={`farm-row-${farm.id}`}>
                          <TableCell className="font-medium text-[#2d5016]">{farm.name}</TableCell>
                          <TableCell className="text-[#5a7c3b]">{farm.location || '-'}</TableCell>
                          <TableCell className="text-[#5a7c3b]">{farm.description || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteFarm(farm.id)}
                              data-testid={`delete-farm-${farm.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Continue with other tabs in next part... */}
          
        </Tabs>
      </div>
    </div>
  );
};

export default OwnerDashboard;
