import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SelectChangeEvent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchAnalyticsOverview,
  fetchTaskAnalytics,
  fetchAgentPerformance,
} from '../../store/analyticsSlice';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics: React.FC = () => {
  const dispatch = useDispatch();
  const analyticsState = useSelector((state: RootState) => state.analytics);
  const { 
    loading, 
    error
  } = analyticsState as any;

  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('tasks');

  useEffect(() => {
    dispatch(fetchAnalyticsOverview() as any);
    dispatch(fetchTaskAnalytics() as any);
    dispatch(fetchAgentPerformance() as any);
  }, [dispatch]);

  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    const newTimeRange = event.target.value;
    setSelectedTimeRange(newTimeRange);
    // TODO: Convert time range to proper date format for setDateRange
  };

  const handleMetricChange = (event: SelectChangeEvent<string>) => {
    setSelectedMetric(event.target.value);
  };

  // Sample data for charts (in real app, this would come from Redux store)
  const taskStatusData = [
    { name: 'Completed', value: 145, color: '#00C49F' },
    { name: 'Running', value: 23, color: '#0088FE' },
    { name: 'Failed', value: 12, color: '#FF8042' },
    { name: 'Pending', value: 67, color: '#FFBB28' },
  ];

  const performanceData = [
    { name: 'Mon', tasks: 24, agents: 5, conversations: 12 },
    { name: 'Tue', tasks: 18, agents: 7, conversations: 15 },
    { name: 'Wed', tasks: 32, agents: 6, conversations: 18 },
    { name: 'Thu', tasks: 28, agents: 8, conversations: 22 },
    { name: 'Fri', tasks: 35, agents: 9, conversations: 25 },
    { name: 'Sat', tasks: 15, agents: 4, conversations: 8 },
    { name: 'Sun', tasks: 12, agents: 3, conversations: 6 },
  ];

  const agentEfficiencyData = [
    { name: 'Agent A', efficiency: 95, tasks: 45 },
    { name: 'Agent B', efficiency: 88, tasks: 38 },
    { name: 'Agent C', efficiency: 92, tasks: 42 },
    { name: 'Agent D', efficiency: 78, tasks: 28 },
    { name: 'Agent E', efficiency: 85, tasks: 33 },
  ];

  const renderMetricCard = (title: string, value: string | number, change: string, color: string) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" color={color}>
          {value}
        </Typography>
        <Chip
          label={change}
          size="small"
          color={change.startsWith('+') ? 'success' : 'error'}
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={selectedTimeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="1d">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 3 Months</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              label="Metric"
              onChange={handleMetricChange}
            >
              <MenuItem value="tasks">Tasks</MenuItem>
              <MenuItem value="agents">Agents</MenuItem>
              <MenuItem value="chat">Chat</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard('Total Tasks', '247', '+12%', 'primary.main')}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard('Active Agents', '8', '+2', 'secondary.main')}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard('Conversations', '156', '+8%', 'info.main')}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard('Success Rate', '87.5%', '+3.2%', 'success.main')}
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Task Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Task Status Distribution" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Performance Trends" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tasks" stroke="#8884d8" />
                  <Line type="monotone" dataKey="agents" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="conversations" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Agent Efficiency */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Agent Efficiency" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentEfficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* System Resource Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="System Resource Usage" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  CPU Usage
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={65}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="caption" color="text.secondary">
                  65%
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Memory Usage
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={42}
                  sx={{ height: 10, borderRadius: 5 }}
                  color="secondary"
                />
                <Typography variant="caption" color="text.secondary">
                  42%
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Disk Usage
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={78}
                  sx={{ height: 10, borderRadius: 5 }}
                  color="warning"
                />
                <Typography variant="caption" color="text.secondary">
                  78%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Recent Activity" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Activity</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>2 minutes ago</TableCell>
                      <TableCell>Task "Data Analysis" completed</TableCell>
                      <TableCell>Agent A</TableCell>
                      <TableCell>
                        <Chip label="Completed" size="small" color="success" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>5 minutes ago</TableCell>
                      <TableCell>New conversation started</TableCell>
                      <TableCell>User123</TableCell>
                      <TableCell>
                        <Chip label="Active" size="small" color="info" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>10 minutes ago</TableCell>
                      <TableCell>Agent B deployed</TableCell>
                      <TableCell>Admin</TableCell>
                      <TableCell>
                        <Chip label="Deployed" size="small" color="primary" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
