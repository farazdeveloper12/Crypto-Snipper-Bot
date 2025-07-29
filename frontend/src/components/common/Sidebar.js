// frontend/src/components/common/Sidebar.js
import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  CurrencyExchange as TradingIcon,
  AccountBalanceWallet as WalletIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard' 
    },
    { 
      text: 'Trading', 
      icon: <TradingIcon />, 
      path: '/trading' 
    },
    { 
      text: 'Wallet', 
      icon: <WalletIcon />, 
      path: '/wallet' 
    },
    { 
      text: 'Security', 
      icon: <SecurityIcon />, 
      path: '/security' 
    }
  ];

  return (
    <Drawer 
      anchor="left" 
      open={open} 
      onClose={onClose}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;