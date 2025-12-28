import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import DashboardStats from '@/components/DashboardStats';
import PasswordResetPrompt from '@/components/PasswordResetPrompt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Calendar, Leaf } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FarmerDashboard = () => {
  const [todayTasks, setTodayTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [notes, setNotes] = useState('');
  const [completeDialog, setCompleteDialog] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const [todayRes, allRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedules/today`),
        axios.get(`${API_URL}/api/schedules?status=pending`)
      ]);
      setTodayTasks(todayRes.data);
      setAllTasks(allRes.data);
    } catch (error) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.post(`${API_URL}/api/schedules/${taskId}/complete`, { notes });
      setSuccess('Task completed successfully! Inventory auto-updated.');
      setCompleteDialog(false);
      setSelectedTask(null);
      setNotes('');
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to complete task');
      setTimeout(() => setError(''), 5000);
    }
  };

  const openCompleteDialog = (task) => {
    setSelectedTask(task);
    setCompleteDialog(true);
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
          <h1 className="text-4xl font-bold text-[#2d5016] mb-2">Farmer Dashboard</h1>
          <p className="text-[#5a7c3b]">Complete your daily farming tasks</p>
        </div>

        <div className="mb-8">
          <DashboardStats />
        </div>

        {/* Today's Tasks */}
        <Card className="mb-8 shadow-lg border-l-4 border-l-[#558b2f]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#558b2f]/10 rounded-lg">
                <Calendar className="w-6 h-6 text-[#558b2f]" />
              </div>
              <div>
                <CardTitle className="text-2xl text-[#2d5016]">Today's Tasks</CardTitle>
                <CardDescription className="text-[#5a7c3b]">Complete these tasks today</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-[#8bc34a] mx-auto mb-4" />
                <p className="text-[#5a7c3b] text-lg">No pending tasks for today. Great job!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#2d5016]">Task Type</TableHead>
                    <TableHead className="text-[#2d5016]">Scheduled Date</TableHead>
                    <TableHead className="text-[#2d5016]">Quantity Required</TableHead>
                    <TableHead className="text-[#2d5016]">Status</TableHead>
                    <TableHead className="text-[#2d5016]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayTasks.map((task) => (
                    <TableRow key={task.id} data-testid={`task-row-${task.id}`}>
                      <TableCell className="font-medium text-[#2d5016]">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-[#8bc34a]" />
                          {task.task_type.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#5a7c3b]">{task.scheduled_for}</TableCell>
                      <TableCell className="text-[#5a7c3b]">
                        {task.quantity_required ? `${task.quantity_required} ${task.unit}` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          data-testid={`complete-task-${task.id}`}
                          onClick={() => openCompleteDialog(task)}
                          className="bg-[#558b2f] hover:bg-[#33691e]"
                          size="sm"
                        >
                          Complete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* All Pending Tasks */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2d5016]">All Pending Tasks</CardTitle>
            <CardDescription className="text-[#5a7c3b]">Upcoming and past due tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {allTasks.length === 0 ? (
              <div className="text-center py-8 text-[#5a7c3b]">
                No pending tasks assigned to you.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#2d5016]">Task Type</TableHead>
                    <TableHead className="text-[#2d5016]">Scheduled Date</TableHead>
                    <TableHead className="text-[#2d5016]">Quantity</TableHead>
                    <TableHead className="text-[#2d5016]">Status</TableHead>
                    <TableHead className="text-[#2d5016]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-[#2d5016]">{task.task_type}</TableCell>
                      <TableCell className="text-[#5a7c3b]">{task.scheduled_for}</TableCell>
                      <TableCell className="text-[#5a7c3b]">
                        {task.quantity_required ? `${task.quantity_required} ${task.unit}` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => openCompleteDialog(task)}
                          className="bg-[#558b2f] hover:bg-[#33691e]"
                          size="sm"
                        >
                          Complete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Complete Task Dialog */}
        <Dialog open={completeDialog} onOpenChange={setCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[#2d5016]">Complete Task</DialogTitle>
              <DialogDescription className="text-[#5a7c3b]">
                Mark this task as completed. Inventory will be automatically deducted.
              </DialogDescription>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div className="bg-[#f1f8e9] p-4 rounded-lg border border-[#8bc34a]/20">
                  <p className="text-sm font-medium text-[#2d5016]">Task: {selectedTask.task_type.toUpperCase()}</p>
                  <p className="text-sm text-[#5a7c3b]">Date: {selectedTask.scheduled_for}</p>
                  {selectedTask.quantity_required && (
                    <p className="text-sm text-[#5a7c3b]">
                      Required: {selectedTask.quantity_required} {selectedTask.unit}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="task-notes" className="text-[#2d5016]">Notes (Optional)</Label>
                  <Textarea
                    id="task-notes"
                    data-testid="task-notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any observations or notes..."
                    className="border-[#8bc34a]/40 mt-2"
                  />
                </div>
                <Button
                  data-testid="confirm-complete-button"
                  onClick={() => handleCompleteTask(selectedTask.id)}
                  className="w-full bg-[#558b2f] hover:bg-[#33691e]"
                >
                  Confirm Completion
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FarmerDashboard;
