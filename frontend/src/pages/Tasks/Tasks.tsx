import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  executeTask,
  Task,
} from '../../store/tasksSlice';
import { selectAvailableAgents } from '../../store/agentsSlice';

const Tasks: React.FC = () => {
  const dispatch = useDispatch();
  const tasksState = useSelector((state: RootState) => state.tasks);
  const availableAgents = useSelector(selectAvailableAgents);
  
  const { tasks, loading, error } = tasksState as any; // TODO: Fix typing issue

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
    agent_id: '',
    dependencies: [] as string[],
  });

  useEffect(() => {
    dispatch(fetchTasks({}) as any);
  }, [dispatch]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      type: '',
      priority: 'medium',
      status: 'pending',
      agent_id: '',
      dependencies: [],
    });
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: task.status,
      agent_id: task.agent_id || '',
      dependencies: task.dependencies,
    });
    setDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (editingTask) {
      dispatch(updateTask({ id: editingTask.id, updates: formData }) as any);
    } else {
      dispatch(createTask(formData) as any);
    }
    setDialogOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(taskId) as any);
    }
  };

  const handleExecuteTask = (taskId: string) => {
    dispatch(executeTask(taskId) as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'running':
        return 'info';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'success';
      case 'medium':
        return 'info';
      case 'high':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderTaskActions = (task: Task) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {task.status === 'pending' && (
        <Tooltip title="Execute Task">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleExecuteTask(task.id)}
          >
            <PlayIcon />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Edit Task">
        <IconButton
          size="small"
          onClick={() => handleEditTask(task)}
          disabled={task.status === 'running'}
        >
          <EditIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete Task">
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDeleteTask(task.id)}
          disabled={task.status === 'running'}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Agent</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task: Task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {task.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.description}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={task.type}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  icon={<TaskIcon />}
                  label={availableAgents.find((a) => a.id === task.agent_id)?.name || 'No Agent'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={task.priority}
                  size="small"
                  color={getPriorityColor(task.priority)}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={task.status}
                  size="small"
                  color={getStatusColor(task.status)}
                />
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {new Date(task.created_at).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                {renderTaskActions(task)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCardView = () => (
    <Grid container spacing={3}>
      {tasks.map((task: Task) => (
        <Grid item xs={12} md={6} lg={4} key={task.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" component="h3">
                  {task.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Chip
                    label={task.priority}
                    size="small"
                    color={getPriorityColor(task.priority)}
                  />
                  <Chip
                    label={task.status}
                    size="small"
                    color={getStatusColor(task.status)}
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {task.description}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Type: {task.type}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Agent: {availableAgents.find((a) => a.id === task.agent_id)?.name || 'No Agent'}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(task.created_at).toLocaleDateString()}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              {renderTaskActions(task)}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('cards')}
          >
            Card View
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      )}

      {viewMode === 'table' ? renderTableView() : renderCardView()}

      <Fab
        color="primary"
        aria-label="add task"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateTask}
      >
        <AddIcon />
      </Fab>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                helperText="e.g., analysis, generation, data_processing"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={formData.agent_id}
                  label="Agent"
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                >
                  <MenuItem value="">No Agent</MenuItem>
                  {availableAgents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTask} variant="contained">
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;
