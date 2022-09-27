import {
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Grid,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  AutoGraphOutlined,
  CircleNotificationsOutlined,
} from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GroupCard from '../components/GroupCard';
import { API } from 'aws-amplify';
import {
  getTotalGlobalCO2,
  getAllGroupsForUser,
  getAllSubmittedActionsToValidate,
  getAllSubmittedActionsOfUsersWithoutGroupToValidateForAdmin,
  getAllUnvalidatedSubmittedActionsForUser,
  getSingleUser,
} from '../graphql/queries';
import GlobalLeaderboard from '../components/GlobalLeaderboard';

const StyledPaper = styled(Paper)`
  padding: 1em 2em;
  text-align: center;
  .statValue {
    margin-top: 0.5em;
  }
`;

const Landing = ({ user, userType }) => {
  const navigate = useNavigate();
  const [progressStats, setProgressStats] = useState({
    globalCO2: '',
    totalCO2: '',
    weekCO2: '',
  });
  const [userGroups, setUserGroups] = useState([]);
  const [numActionsToValidate, setNumActionsToValidate] = useState();
  const [pendingActions, setPendingActions] = useState();
  const [pendingCO2Saved, setPendingCO2Saved] = useState();

  useEffect(() => {
    if (user) {
      getProgressStats();
      getGroups();
      getNumActionsToValidate();
      getPendingActions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getProgressStats = async () => {
    const [userRes, globalCO2Res] = await Promise.all([
      API.graphql({
        query: getSingleUser,
        variables: { user_id: user.user_id },
      }),
      API.graphql({ query: getTotalGlobalCO2 }),
    ]);
    setProgressStats((prev) => ({
      ...prev,
      globalCO2: globalCO2Res.data.getTotalGlobalCO2,
      totalCO2: userRes.data.getSingleUser.total_co2,
      weekCO2: userRes.data.getSingleUser.weekly_co2,
    }));
  };

  const getGroups = async () => {
    const res = await API.graphql({
      query: getAllGroupsForUser,
      variables: { user_id: user.user_id },
    });
    setUserGroups(res.data.getAllGroupsForUser);
  };

  const getNumActionsToValidate = async () => {
    const groupSubmittedActionRes = await API.graphql({
      query: getAllSubmittedActionsToValidate,
      variables: { user_id: user.user_id },
    });
    const numGroupSubmittedActions =
      groupSubmittedActionRes.data.getAllSubmittedActionsToValidate.length;

    if (userType === 'Admin') {
      const userWithoutGroupActionRes = await API.graphql({
        query: getAllSubmittedActionsOfUsersWithoutGroupToValidateForAdmin,
      });
      const numUserWithoutGroupActions =
        userWithoutGroupActionRes.data
          .getAllSubmittedActionsOfUsersWithoutGroupToValidateForAdmin.length;
      setNumActionsToValidate(
        numGroupSubmittedActions + numUserWithoutGroupActions
      );
    } else {
      setNumActionsToValidate(numGroupSubmittedActions);
    }
  };

  const getPendingActions = async () => {
    const res = await API.graphql({
      query: getAllUnvalidatedSubmittedActionsForUser,
      variables: { user_id: user.user_id },
    });

    const unvalidatedSubmittedActions =
      res.data.getAllUnvalidatedSubmittedActionsForUser;
    const pendingCO2 = unvalidatedSubmittedActions
      .map((action) => action.g_co2_saved)
      .reduce((prev, next) => prev + next);

    setPendingActions(unvalidatedSubmittedActions);
    setPendingCO2Saved(pendingCO2);
  };

  const renderGroupCards = () => {
    if (userGroups.length > 0) {
      return userGroups.map((group, index) => (
        <GroupCard key={index} group={group} user={user} />
      ));
    } else {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: '2em' }}>
          <Typography variant="subtitle2">
            No groups to display. Create or join a group to get started!
          </Typography>
        </Box>
      );
    }
  };

  return (
    <>
      {user ? (
        <Grid
          container
          alignItems={{ xs: 'center', lg: 'flex-start' }}
          direction={{ xs: 'column', lg: 'row' }}
          gap={{ xs: '2em', lg: '0' }}
          textAlign={{ xs: 'center', lg: 'left' }}
        >
          <Grid
            item
            xs={12}
            justifyContent="center"
            sx={{ width: { xs: '70%', sm: '100%' } }}
          >
            <Typography
              variant="h1"
              sx={{
                mt: { xs: '1.5em', lg: '0' },
                wordWrap: 'break-word',
                maxWidth: { xs: '400px', sm: '100%' },
              }}
            >
              Welcome {user.name}!
            </Typography>
            {numActionsToValidate > 0 && (
              <Alert
                icon={<CircleNotificationsOutlined />}
                variant="outlined"
                sx={{
                  mt: '3em',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  alignItems: { xs: 'center', sm: 'flex-start' },
                }}
                color="info"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => navigate('/validate-actions')}
                  >
                    Start Validating
                  </Button>
                }
              >
                <AlertTitle>New Actions In Need of Validation</AlertTitle>
                You have <strong>{numActionsToValidate}</strong> actions to
                validate!
              </Alert>
            )}
            {pendingActions && pendingActions.length > 0 && pendingCO2Saved && (
              <Alert
                icon={<CircleNotificationsOutlined />}
                variant="outlined"
                sx={{
                  mt: numActionsToValidate > 0 ? '1em' : '3em',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  alignItems: { xs: 'center', sm: 'flex-start' },
                }}
                color="success"
              >
                <AlertTitle>
                  {pendingActions.length} Actions Pending Validation
                </AlertTitle>
                The impact of your pending actions is{' '}
                <strong>{pendingCO2Saved}g</strong> of CO2 saved
              </Alert>
            )}
          </Grid>
          <Grid
            item
            xs={12}
            justifyContent="center"
            sx={{ width: { xs: '70%', sm: '100%' } }}
          >
            <Typography
              variant="h2"
              sx={{ m: { xs: '0.5em 0 1.25em', md: '1.5em 0 1.25em' } }}
            >
              Recent Progress
            </Typography>
            <Box
              component={Paper}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-evenly',
                backgroundColor: '#DBE2EF',
                borderRadius: '8px',
                padding: '1.5em',
                gap: { xs: '0.5em', lg: '0' },
              }}
            >
              <StyledPaper elevation={6}>
                <Typography variant="h4">CO2 Saved This Week</Typography>
                <Typography variant="h5" className="statValue">
                  <AutoGraphOutlined fontSize="large" />
                  {progressStats.weekCO2}g
                </Typography>
              </StyledPaper>
              <StyledPaper elevation={6}>
                <Typography variant="h4">Total CO2 Saved</Typography>
                <Typography variant="h5" className="statValue">
                  {progressStats.totalCO2}g
                </Typography>
              </StyledPaper>
              <StyledPaper elevation={6}>
                <Typography variant="h4">Collective Impact</Typography>
                <Typography variant="h5" className="statValue">
                  {progressStats.globalCO2}g
                </Typography>
              </StyledPaper>
            </Box>
          </Grid>
          <Grid
            container
            item
            sx={{
              mt: { xs: '2em', md: '3em' },
              width: { xs: '70%', sm: '100%' },
            }}
          >
            <GlobalLeaderboard />
            <Grid item xs={12} justifyContent="center" sx={{ width: '70%' }}>
              <Box
                component="div"
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  m: '4em 0 1.25em',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: { xs: '1em' },
                }}
              >
                <Typography variant="h2">My Groups</Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    navigate('/create-group');
                  }}
                >
                  Create New Group
                </Button>
              </Box>
              {renderGroupCards()}
            </Grid>
          </Grid>
        </Grid>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <LinearProgress />
        </Box>
      )}
    </>
  );
};

export default Landing;
