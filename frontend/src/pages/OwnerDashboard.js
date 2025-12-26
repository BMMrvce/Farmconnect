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
      // Fetch existing endpoints
      const farmsRes = await axios.get(`${API_URL}/api/farms`);
      setFarms(farmsRes.data);
      
      const plotsRes = await axios.get(`${API_URL}/api/plots`);
      setPlots(plotsRes.data);
      
      // Fetch growth cycles and requirements
      const cyclesRes = await axios.get(`${API_URL}/api/growth-cycles`);
      setGrowthCycles(cyclesRes.data);
      
      const requirementsRes = await axios.get(`${API_URL}/api/plant-requirements`);
      setPlantRequirements(requirementsRes.data);
      
      // Fetch plants
      const plantsRes = await axios.get(`${API_URL}/api/plants`);
      setPlants(plantsRes.data);
      
      // Set empty array for inventory (not yet implemented)
      setInventory([]);
    } catch (error) {
      showError('Failed to fetch data');
      console.error('Fetch error:', error);
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

          {/* PLOTS TAB */}
          <TabsContent value="plots">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl text-[#2d5016]">Plots</CardTitle>
                    <CardDescription className="text-[#5a7c3b]">Manage farm plots and divisions</CardDescription>
                  </div>
                  <Dialog open={plotDialog} onOpenChange={setPlotDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-plot-button" className="bg-[#558b2f] hover:bg-[#33691e]">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Plot
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-[#2d5016]">Create New Plot</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreatePlot} className="space-y-4">
                        <div>
                          <Label className="text-[#2d5016]">Farm *</Label>
                          <select
                            data-testid="plot-farm-select"
                            value={plotForm.farm_id}
                            onChange={(e) => setPlotForm({ ...plotForm, farm_id: e.target.value })}
                            required
                            className="w-full border border-[#8bc34a]/40 rounded-md p-2"
                          >
                            <option value="">Select Farm</option>
                            {farms.map(farm => (
                              <option key={farm.id} value={farm.id}>{farm.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Plot Name *</Label>
                          <Input
                            data-testid="plot-name-input"
                            value={plotForm.name}
                            onChange={(e) => setPlotForm({ ...plotForm, name: e.target.value })}
                            required
                            placeholder="Plot A1"
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Area (sqm)</Label>
                          <Input
                            type="number"
                            value={plotForm.area_sqm}
                            onChange={(e) => setPlotForm({ ...plotForm, area_sqm: e.target.value })}
                            placeholder="1000"
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Soil Type</Label>
                          <Input
                            value={plotForm.soil_type}
                            onChange={(e) => setPlotForm({ ...plotForm, soil_type: e.target.value })}
                            placeholder="Loamy"
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <Button type="submit" data-testid="submit-plot-button" className="w-full bg-[#558b2f] hover:bg-[#33691e]">
                          Create Plot
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
                      <TableHead className="text-[#2d5016]">Farm</TableHead>
                      <TableHead className="text-[#2d5016]">Area (sqm)</TableHead>
                      <TableHead className="text-[#2d5016]">Soil Type</TableHead>
                      <TableHead className="text-[#2d5016]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-[#5a7c3b] py-8">
                          No plots yet. Create plots to divide your farms.
                        </TableCell>
                      </TableRow>
                    ) : (
                      plots.map((plot) => {
                        const farm = farms.find(f => f.id === plot.farm_id);
                        return (
                          <TableRow key={plot.id} data-testid={`plot-row-${plot.id}`}>
                            <TableCell className="font-medium text-[#2d5016]">{plot.name}</TableCell>
                            <TableCell className="text-[#5a7c3b]">{farm?.name || '-'}</TableCell>
                            <TableCell className="text-[#5a7c3b]">{plot.area_sqm || '-'}</TableCell>
                            <TableCell className="text-[#5a7c3b]">{plot.soil_type || '-'}</TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeletePlot(plot.id)}
                                data-testid={`delete-plot-${plot.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PLANTS TAB */}
          <TabsContent value="plants">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl text-[#2d5016]">Plant Catalog</CardTitle>
                    <CardDescription className="text-[#5a7c3b]">Manage plant species and their requirements</CardDescription>
                  </div>
                  <Dialog open={plantDialog} onOpenChange={setPlantDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-plant-button" className="bg-[#558b2f] hover:bg-[#33691e]">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Plant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-[#2d5016]">Add Plant Species</DialogTitle>
                        <DialogDescription className="text-[#5a7c3b]">Add a new plant to your catalog</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreatePlant} className="space-y-4">
                        <div>
                          <Label className="text-[#2d5016]">Plant Name *</Label>
                          <Input
                            data-testid="plant-name-input"
                            value={plantForm.name}
                            onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                            required
                            placeholder="Tomato"
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Scientific Name</Label>
                          <Input
                            value={plantForm.scientific_name}
                            onChange={(e) => setPlantForm({ ...plantForm, scientific_name: e.target.value })}
                            placeholder="Solanum lycopersicum"
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Growth Cycle</Label>
                          <select
                            value={plantForm.growth_cycle_id}
                            onChange={(e) => setPlantForm({ ...plantForm, growth_cycle_id: e.target.value })}
                            className="w-full border border-[#8bc34a]/40 rounded-md p-2"
                          >
                            <option value="">Select Growth Cycle</option>
                            {growthCycles.map(cycle => (
                              <option key={cycle.id} value={cycle.id}>
                                {cycle.total_growth_days} days total
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Requirements</Label>
                          <select
                            value={plantForm.requirement_id}
                            onChange={(e) => setPlantForm({ ...plantForm, requirement_id: e.target.value })}
                            className="w-full border border-[#8bc34a]/40 rounded-md p-2"
                          >
                            <option value="">Select Requirements</option>
                            {plantRequirements.map((req, idx) => (
                              <option key={req.id} value={req.id}>
                                Requirement Set {idx + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Notes</Label>
                          <Textarea
                            value={plantForm.notes}
                            onChange={(e) => setPlantForm({ ...plantForm, notes: e.target.value })}
                            placeholder="Additional notes..."
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <Button type="submit" data-testid="submit-plant-button" className="w-full bg-[#558b2f] hover:bg-[#33691e]">
                          Create Plant
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
                      <TableHead className="text-[#2d5016]">Scientific Name</TableHead>
                      <TableHead className="text-[#2d5016]">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-[#5a7c3b] py-8">
                          No plants yet. Add plant species to your catalog.
                        </TableCell>
                      </TableRow>
                    ) : (
                      plants.map((plant) => (
                        <TableRow key={plant.id} data-testid={`plant-row-${plant.id}`}>
                          <TableCell className="font-medium text-[#2d5016]">{plant.name}</TableCell>
                          <TableCell className="text-[#5a7c3b]">{plant.scientific_name || '-'}</TableCell>
                          <TableCell className="text-[#5a7c3b] text-sm">{plant.notes || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PLANT INSTANCES TAB */}
          <TabsContent value="instances">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl text-[#2d5016]">Plant Instances</CardTitle>
                    <CardDescription className="text-[#5a7c3b]">Track actual plantings and growth progress</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => fetchPlantInstances()}
                      variant="outline"
                      className="border-[#8bc34a] text-[#558b2f]"
                    >
                      Refresh
                    </Button>
                    <Dialog open={instanceDialog} onOpenChange={setInstanceDialog}>
                      <DialogTrigger asChild>
                        <Button data-testid="create-instance-button" className="bg-[#558b2f] hover:bg-[#33691e]">
                          <Plus className="w-4 h-4 mr-2" />
                          Plant Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-[#2d5016]">Create Plant Instance</DialogTitle>
                          <DialogDescription className="text-[#5a7c3b]">Record a new planting and auto-generate schedules</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateInstance} className="space-y-4">
                          <div>
                            <Label className="text-[#2d5016]">Plot *</Label>
                            <select
                              data-testid="instance-plot-select"
                              value={instanceForm.plot_id}
                              onChange={(e) => setInstanceForm({ ...instanceForm, plot_id: e.target.value })}
                              required
                              className="w-full border border-[#8bc34a]/40 rounded-md p-2"
                            >
                              <option value="">Select Plot</option>
                              {plots.map(plot => (
                                <option key={plot.id} value={plot.id}>{plot.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-[#2d5016]">Plant Species *</Label>
                            <select
                              data-testid="instance-plant-select"
                              value={instanceForm.plant_id}
                              onChange={(e) => setInstanceForm({ ...instanceForm, plant_id: e.target.value })}
                              required
                              className="w-full border border-[#8bc34a]/40 rounded-md p-2"
                            >
                              <option value="">Select Plant</option>
                              {plants.map(plant => (
                                <option key={plant.id} value={plant.id}>{plant.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-[#2d5016]">Planted On *</Label>
                            <Input
                              data-testid="instance-date-input"
                              type="date"
                              value={instanceForm.planted_on}
                              onChange={(e) => setInstanceForm({ ...instanceForm, planted_on: e.target.value })}
                              required
                              className="border-[#8bc34a]/40"
                            />
                          </div>
                          <div>
                            <Label className="text-[#2d5016]">Count *</Label>
                            <Input
                              type="number"
                              value={instanceForm.count}
                              onChange={(e) => setInstanceForm({ ...instanceForm, count: parseInt(e.target.value) })}
                              required
                              min="1"
                              className="border-[#8bc34a]/40"
                            />
                          </div>
                          <Button type="submit" data-testid="submit-instance-button" className="w-full bg-[#558b2f] hover:bg-[#33691e]">
                            Create Instance
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[#2d5016]">Plant</TableHead>
                      <TableHead className="text-[#2d5016]">Plot</TableHead>
                      <TableHead className="text-[#2d5016]">Planted On</TableHead>
                      <TableHead className="text-[#2d5016]">Count</TableHead>
                      <TableHead className="text-[#2d5016]">Growth Stage</TableHead>
                      <TableHead className="text-[#2d5016]">Days</TableHead>
                      <TableHead className="text-[#2d5016]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plantInstances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-[#5a7c3b] py-8">
                          No plant instances yet. Create your first planting.
                        </TableCell>
                      </TableRow>
                    ) : (
                      plantInstances.map((instance) => {
                        const plant = plants.find(p => p.id === instance.plant_id);
                        const plot = plots.find(p => p.id === instance.plot_id);
                        return (
                          <TableRow key={instance.id} data-testid={`instance-row-${instance.id}`}>
                            <TableCell className="font-medium text-[#2d5016]">{plant?.name || '-'}</TableCell>
                            <TableCell className="text-[#5a7c3b]">{plot?.name || '-'}</TableCell>
                            <TableCell className="text-[#5a7c3b]">{instance.planted_on}</TableCell>
                            <TableCell className="text-[#5a7c3b]">{instance.count}</TableCell>
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
                            <TableCell className="text-[#5a7c3b]">{instance.days_since_planting || '-'}</TableCell>
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
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVENTORY TAB */}
          <TabsContent value="inventory">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl text-[#2d5016]">Inventory Management</CardTitle>
                    <CardDescription className="text-[#5a7c3b]">Track materials used for plant care</CardDescription>
                  </div>
                  <Dialog open={inventoryDialog} onOpenChange={setInventoryDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="create-inventory-button" className="bg-[#558b2f] hover:bg-[#33691e]">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-[#2d5016]">Add Inventory Item</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateInventory} className="space-y-4">
                        <div>
                          <Label className="text-[#2d5016]">Item Name *</Label>
                          <Input
                            data-testid="inventory-name-input"
                            value={inventoryForm.name}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                            required
                            placeholder="Water / Panchagavya / Spray"
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Unit *</Label>
                          <Input
                            value={inventoryForm.unit}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                            required
                            placeholder="ml / l / kg / g"
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Initial Quantity *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={inventoryForm.quantity}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: parseFloat(e.target.value) })}
                            required
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <div>
                          <Label className="text-[#2d5016]">Reorder Level</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={inventoryForm.reorder_level}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, reorder_level: parseFloat(e.target.value) })}
                            className="border-[#8bc34a]/40"
                          />
                        </div>
                        <Button type="submit" data-testid="submit-inventory-button" className="w-full bg-[#558b2f] hover:bg-[#33691e]">
                          Add Item
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
                      <TableHead className="text-[#2d5016]">Item Name</TableHead>
                      <TableHead className="text-[#2d5016]">Unit</TableHead>
                      <TableHead className="text-[#2d5016]">Quantity</TableHead>
                      <TableHead className="text-[#2d5016]">Reorder Level</TableHead>
                      <TableHead className="text-[#2d5016]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-[#5a7c3b] py-8">
                          No inventory items. Add materials to track usage.
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventory.map((item) => {
                        const isLowStock = item.quantity <= item.reorder_level;
                        return (
                          <TableRow key={item.id} data-testid={`inventory-row-${item.id}`} className={isLowStock ? 'bg-red-50' : ''}>
                            <TableCell className="font-medium text-[#2d5016]">{item.name}</TableCell>
                            <TableCell className="text-[#5a7c3b]">{item.unit}</TableCell>
                            <TableCell className="text-[#5a7c3b]">{item.quantity.toFixed(2)}</TableCell>
                            <TableCell className="text-[#5a7c3b]">{item.reorder_level.toFixed(2)}</TableCell>
                            <TableCell>
                              {isLowStock ? (
                                <span className="flex items-center text-red-600 text-sm font-medium">
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  Low Stock
                                </span>
                              ) : (
                                <span className="flex items-center text-green-600 text-sm font-medium">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  In Stock
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETUP TAB (Growth Cycles & Requirements) */}
          <TabsContent value="setup">
            <div className="space-y-6">
              {/* Growth Cycles */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl text-[#2d5016]">Growth Cycles</CardTitle>
                      <CardDescription className="text-[#5a7c3b]">Define plant lifecycle durations</CardDescription>
                    </div>
                    <Dialog open={cycleDialog} onOpenChange={setCycleDialog}>
                      <DialogTrigger asChild>
                        <Button data-testid="create-cycle-button" className="bg-[#558b2f] hover:bg-[#33691e]">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Cycle
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-[#2d5016]">Create Growth Cycle</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateCycle} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-[#2d5016]">Germination (days)</Label>
                              <Input
                                type="number"
                                value={cycleForm.germination_days}
                                onChange={(e) => setCycleForm({ ...cycleForm, germination_days: parseInt(e.target.value) || 0 })}
                                className="border-[#8bc34a]/40"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label className="text-[#2d5016]">Vegetative (days)</Label>
                              <Input
                                type="number"
                                value={cycleForm.vegetative_days}
                                onChange={(e) => setCycleForm({ ...cycleForm, vegetative_days: parseInt(e.target.value) || 0 })}
                                className="border-[#8bc34a]/40"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label className="text-[#2d5016]">Flowering (days)</Label>
                              <Input
                                type="number"
                                value={cycleForm.flowering_days}
                                onChange={(e) => setCycleForm({ ...cycleForm, flowering_days: parseInt(e.target.value) || 0 })}
                                className="border-[#8bc34a]/40"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label className="text-[#2d5016]">Fruiting (days)</Label>
                              <Input
                                type="number"
                                value={cycleForm.fruiting_days}
                                onChange={(e) => setCycleForm({ ...cycleForm, fruiting_days: parseInt(e.target.value) || 0 })}
                                className="border-[#8bc34a]/40"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[#2d5016]">Total Growth Days *</Label>
                            <Input
                              type="number"
                              value={cycleForm.total_growth_days}
                              onChange={(e) => setCycleForm({ ...cycleForm, total_growth_days: parseInt(e.target.value) || 0 })}
                              min="1"
                              required
                              className="border-[#8bc34a]/40"
                            />
                          </div>
                          <Button type="submit" data-testid="submit-cycle-button" className="w-full bg-[#558b2f] hover:bg-[#33691e]">
                            Create Cycle
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
                        <TableHead className="text-[#2d5016]">Germination</TableHead>
                        <TableHead className="text-[#2d5016]">Vegetative</TableHead>
                        <TableHead className="text-[#2d5016]">Flowering</TableHead>
                        <TableHead className="text-[#2d5016]">Fruiting</TableHead>
                        <TableHead className="text-[#2d5016]">Total Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {growthCycles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-[#5a7c3b] py-8">
                            No growth cycles defined.
                          </TableCell>
                        </TableRow>
                      ) : (
                        growthCycles.map((cycle) => (
                          <TableRow key={cycle.id} data-testid={`cycle-row-${cycle.id}`}>
                            <TableCell className="text-[#5a7c3b]">{cycle.germination_days} days</TableCell>
                            <TableCell className="text-[#5a7c3b]">{cycle.vegetative_days} days</TableCell>
                            <TableCell className="text-[#5a7c3b]">{cycle.flowering_days} days</TableCell>
                            <TableCell className="text-[#5a7c3b]">{cycle.fruiting_days} days</TableCell>
                            <TableCell className="font-medium text-[#2d5016]">{cycle.total_growth_days} days</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Plant Requirements */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl text-[#2d5016]">Plant Requirements</CardTitle>
                      <CardDescription className="text-[#5a7c3b]">Define care requirements for plants</CardDescription>
                    </div>
                    <Dialog open={requirementDialog} onOpenChange={setRequirementDialog}>
                      <DialogTrigger asChild>
                        <Button data-testid="create-requirement-button" className="bg-[#558b2f] hover:bg-[#33691e]">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Requirements
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-[#2d5016]">Create Plant Requirements</DialogTitle>
                          <DialogDescription className="text-[#5a7c3b]">All requirements in one set</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateRequirement} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-[#2d5016] text-sm">Water Min (ml)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={requirementForm.water_min_ml}
                                onChange={(e) => setRequirementForm({ ...requirementForm, water_min_ml: parseFloat(e.target.value) || 0 })}
                                className="border-[#8bc34a]/40"
                              />
                            </div>
                            <div>
                              <Label className="text-[#2d5016] text-sm">Water Max (ml)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={requirementForm.water_max_ml}
                                onChange={(e) => setRequirementForm({ ...requirementForm, water_max_ml: parseFloat(e.target.value) || 0 })}
                                className="border-[#8bc34a]/40"
                              />
                            </div>
                            <div>
                              <Label className="text-[#2d5016] text-sm">Panchagavya (l/month)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={requirementForm.panchagavya_l_per_month}
                                onChange={(e) => setRequirementForm({ ...requirementForm, panchagavya_l_per_month: parseFloat(e.target.value) || 0 })}
                                className="border-[#8bc34a]/40"
                              />
                            </div>
                            <div>
                              <Label className="text-[#2d5016] text-sm">Vermicompost (ml/month)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={requirementForm.vermicompost_ml_monthly}
                                onChange={(e) => setRequirementForm({ ...requirementForm, vermicompost_ml_monthly: parseFloat(e.target.value) || 0 })}
                                className="border-[#8bc34a]/40"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-[#5a7c3b]">Note: All fields are optional. Fill only required values.</p>
                          <Button type="submit" data-testid="submit-requirement-button" className="w-full bg-[#558b2f] hover:bg-[#33691e]">
                            Create Requirements
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-[#5a7c3b]">
                    {plantRequirements.length} requirement set(s) created. Each set defines all care requirements for a plant species.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OwnerDashboard;
