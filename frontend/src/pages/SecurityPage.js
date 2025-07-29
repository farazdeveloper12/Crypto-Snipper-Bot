// frontend/src/pages/SecurityPage.js
import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Switch, 
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField
} from '@mui/material';
import { updateSecuritySettings } from '../services/api';

const SecurityPage = () => {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    ipWhitelist: [],
    loginAlerts: false
  });

  const [openIPDialog, setOpenIPDialog] = useState(false);
  const [newIP, setNewIP] = useState('');

  const handleToggleSetting = async (setting) => {
    try {
      const updatedSettings = {
        ...securitySettings,
        [setting]: !securitySettings[setting]
      };
      
      await updateSecuritySettings(updatedSettings);
      setSecuritySettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update security setting', error);
    }
  };

  const addIPToWhitelist = async () => {
    try {
      const updatedSettings = {
        ...securitySettings,
        ipWhitelist: [...securitySettings.ipWhitelist, newIP]
      };
      
      await updateSecuritySettings(updatedSettings);
      setSecuritySettings(updatedSettings);
      setOpenIPDialog(false);
      setNewIP('');
    } catch (error) {
      console.error('Failed to add IP', error);
    }
  };

  const removeIPFromWhitelist = async (ipToRemove) => {
    try {
      const updatedSettings = {
        ...securitySettings,
        ipWhitelist: securitySettings.ipWhitelist.filter(ip => ip !== ipToRemove)
      };
      
      await updateSecuritySettings(updatedSettings);
      setSecuritySettings(updatedSettings);
    } catch (error) {
      console.error('Failed to remove IP', error);
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Security Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Two-Factor Authentication</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onChange={() => handleToggleSetting('twoFactorEnabled')}
                  />
                }
                label="Enable Two-Factor Authentication"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Login Alerts</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.loginAlerts}
                    onChange={() => handleToggleSetting('loginAlerts')}
                  />
                }
                label="Receive Login Alerts"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">IP Whitelist</Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => setOpenIPDialog(true)}
              >
                Add IP Address
              </Button>

              {securitySettings.ipWhitelist.map((ip) => (
                <div key={ip} className="flex justify-between items-center mt-2">
                  <Typography>{ip}</Typography>
                  <Button 
                    color="secondary"
                    onClick={() => removeIPFromWhitelist(ip)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog 
        open={openIPDialog} 
        onClose={() => setOpenIPDialog(false)}
      >
        <DialogTitle>Add IP to Whitelist</DialogTitle>
        <DialogContent>
          <TextField
            label="IP Address"
            fullWidth
            margin="normal"
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            placeholder="192.168.1.1"
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={addIPToWhitelist}
            fullWidth
          >
            Add IP
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default SecurityPage;