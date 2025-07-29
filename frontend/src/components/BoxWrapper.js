// src/components/BoxWrapper.js
import React from 'react';
import { Box as MuiBox } from '@mui/material';

// This wrapper prevents common mistakes with the Box component
const BoxWrapper = (props) => {
  const { children, sx, ...otherProps } = props;
  
  // Filter out any object children that might be style objects
  const safeChildren = React.Children.toArray(children).filter(
    child => typeof child !== 'object' || React.isValidElement(child)
  );
  
  return (
    <MuiBox sx={sx} {...otherProps}>
      {safeChildren}
    </MuiBox>
  );
};

export default BoxWrapper;