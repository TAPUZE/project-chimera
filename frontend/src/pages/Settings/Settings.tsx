import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Snackbar,
  SelectChangeEvent,
} from '@mui/material';
import {
  Save as SaveIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Settings: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth) as any;
  const [activeTab, setActiveTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    autoSave: true,
    notifications: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginNotifications: true,
    ipWhitelist: '',
  });

  // API Settings
  const [apiSettings, setApiSettings] = useState({
    apiKey: '',
    rateLimit: 1000,
    webhookUrl: '',
    enableCors: true,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskCompletionNotifications: true,
    errorNotifications: true,
    weeklyReports: false,
    reminderNotifications: true,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGeneralSettingsChange = (field: string, value: any) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSecuritySettingsChange = (field: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleApiSettingsChange = (field: string, value: any) => {
    setApiSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationSettingsChange = (field: string, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    setSnackbarMessage('Settings saved successfully!');
    setSnackbarOpen(true);
  };

  const handleResetToDefaults = () => {
    // TODO: Implement reset functionality
    setSnackbarMessage('Settings reset to defaults!');
    setSnackbarOpen(true);
  };

  const handleExportSettings = () => {
    // TODO: Implement export functionality
    const settings = {
      general: generalSettings,
      security: securitySettings,
      api: apiSettings,
      notifications: notificationSettings,
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chimera-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderGeneralSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Appearance" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={generalSettings.theme}
                  label="Theme"
                  onChange={(e) => handleGeneralSettingsChange('theme', e.target.value)}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={generalSettings.language}
                  label="Language"
                  onChange={(e) => handleGeneralSettingsChange('language', e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Regional Settings" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={generalSettings.timezone}
                  label="Timezone"
                  onChange={(e) => handleGeneralSettingsChange('timezone', e.target.value)}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time</MenuItem>
                  <MenuItem value="America/Chicago">Central Time</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Date Format</InputLabel>
                <Select
                  value={generalSettings.dateFormat}
                  label="Date Format"
                  onChange={(e) => handleGeneralSettingsChange('dateFormat', e.target.value)}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Preferences" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={generalSettings.autoSave}
                    onChange={(e) => handleGeneralSettingsChange('autoSave', e.target.checked)}
                  />
                }
                label="Auto-save changes"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={generalSettings.notifications}
                    onChange={(e) => handleGeneralSettingsChange('notifications', e.target.checked)}
                  />
                }
                label="Enable notifications"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSecuritySettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Authentication" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => handleSecuritySettingsChange('twoFactorAuth', e.target.checked)}
                  />
                }
                label="Two-Factor Authentication"
              />
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => handleSecuritySettingsChange('sessionTimeout', parseInt(e.target.value))}
              />
              <TextField
                fullWidth
                label="Password Expiry (days)"
                type="number"
                value={securitySettings.passwordExpiry}
                onChange={(e) => handleSecuritySettingsChange('passwordExpiry', parseInt(e.target.value))}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Access Control" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onChange={(e) => handleSecuritySettingsChange('loginNotifications', e.target.checked)}
                  />
                }
                label="Login notifications"
              />
              <TextField
                fullWidth
                label="IP Whitelist (comma-separated)"
                multiline
                rows={3}
                value={securitySettings.ipWhitelist}
                onChange={(e) => handleSecuritySettingsChange('ipWhitelist', e.target.value)}
                helperText="Leave empty to allow all IPs"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderApiSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="API Configuration" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={apiSettings.apiKey}
                onChange={(e) => handleApiSettingsChange('apiKey', e.target.value)}
                helperText="Your API key for external integrations"
              />
              <TextField
                fullWidth
                label="Rate Limit (requests/hour)"
                type="number"
                value={apiSettings.rateLimit}
                onChange={(e) => handleApiSettingsChange('rateLimit', parseInt(e.target.value))}
              />
              <TextField
                fullWidth
                label="Webhook URL"
                value={apiSettings.webhookUrl}
                onChange={(e) => handleApiSettingsChange('webhookUrl', e.target.value)}
                helperText="URL to receive webhook notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={apiSettings.enableCors}
                    onChange={(e) => handleApiSettingsChange('enableCors', e.target.checked)}
                  />
                }
                label="Enable CORS"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderNotificationSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Email Notifications" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => handleNotificationSettingsChange('emailNotifications', e.target.checked)}
                  />
                }
                label="Enable email notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.taskCompletionNotifications}
                    onChange={(e) => handleNotificationSettingsChange('taskCompletionNotifications', e.target.checked)}
                  />
                }
                label="Task completion notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.errorNotifications}
                    onChange={(e) => handleNotificationSettingsChange('errorNotifications', e.target.checked)}
                  />
                }
                label="Error notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onChange={(e) => handleNotificationSettingsChange('weeklyReports', e.target.checked)}
                  />
                }
                label="Weekly reports"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.reminderNotifications}
                    onChange={(e) => handleNotificationSettingsChange('reminderNotifications', e.target.checked)}
                  />
                }
                label="Reminder notifications"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Settings</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleResetToDefaults}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportSettings}
          >
            Export Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="General" />
          <Tab label="Security" />
          <Tab label="API" />
          <Tab label="Notifications" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {renderGeneralSettings()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderSecuritySettings()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {renderApiSettings()}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {renderNotificationSettings()}
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Settings;
