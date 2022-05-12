import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import AllActions from '../components/AllActions';
import ActionCard from '../components/ActionCard';

const ViewAndEditActions = () => {
  const [selectedAction, setSelectedAction] = useState();
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [editAction, setEditAction] = useState(false);

  useEffect(() => {
    setOpenActionDialog(true);
  }, [selectedAction]);

  const handleClose = () => {
    setOpenActionDialog(false);
    setSelectedAction(null);
    setEditAction(false);
  };

  return (
    <>
      <AllActions setSelectedAction={setSelectedAction} />

      {selectedAction && (
        <ActionCard
          action={selectedAction}
          open={openActionDialog}
          handleClose={handleClose}
          editAction={editAction}
          setEditAction={setEditAction}
        ></ActionCard>
      )}
    </>
  );
};
export default ViewAndEditActions;