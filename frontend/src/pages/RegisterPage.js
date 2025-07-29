// src/pages/RegisterPage.js
import React, { useState, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Grid,
  Alert,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const steps = ['Account Information', 'Personal Details'];

const RegisterPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    walletAddress: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate first step
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setFormError('Please fill in all fields');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
      
      if (formData.password.length < 6) {
        setFormError('Password must be at least 6 characters long');
        return;
      }
    }
    
    setFormError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      setFormError('Please fill in all fields');
      return;
    }
    
    // Create user object from form data
    const userData = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      walletAddress: formData.walletAddress,
    };
    
    const success = await register(userData);
    
    if (success) {
      navigate('/dashboard');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 3,
            mb: 4,
          }}
        >
          <Typography variant="h4" align="center" color="primary" gutterBottom>
            Crypto Sniper Bot
          </Typography>
          <Typography variant="h6" align="center" gutterBottom>
            Create Account
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {(error || formError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || formError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={activeStep === steps.length - 1 ? handleSubmit : handleNext}>
            {activeStep === 0 ? (
              // Step 1: Account Information
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={formData.email}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={toggleShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </>
            ) : (
              // Step 2: Personal Details
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  id="walletAddress"
                  label="Solana Wallet Address (Optional)"
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleChange}
                  placeholder="Enter your Solana wallet address"
                />
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              {activeStep !== 0 && (
                <Button onClick={handleBack} variant="outlined">
                  Back
                </Button>
              )}
              
              <Box sx={{ flex: '1 1 auto' }} />
              
              <Button
                type="submit"
                variant="contained"
                sx={{ ml: 1 }}
                disabled={loading}
              >
                {activeStep === steps.length - 1 ? (loading ? 'Creating Account...' : 'Create Account') : 'Next'}
              </Button>
            </Box>
            
            <Grid container justifyContent="center" sx={{ mt: 2 }}>
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;