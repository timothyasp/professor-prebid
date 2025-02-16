import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import ModifyBidResponsesComponent from './debug/ModifyBidResponsesComponent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import logger from '../../../../logger';
import Paper from '@mui/material/Paper';
import { Typography } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import constants from '../../../../constants.json';
import { getTabId } from '../../utils';
import { useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const dfp_open_console = async () => {
  const tabId = await getTabId();
  const fileUrl = chrome.runtime.getURL('openDfpConsole.bundle.js');
  const func = (fileUrl: string) => {
    const script = document.createElement('script');
    script.src = fileUrl;
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => {
      script.remove();
    };
  };
  chrome.scripting.executeScript({ target: { tabId }, func, args: [fileUrl] });
};

const openDebugTab = async () => {
  const url = await chrome.runtime.getURL('app.html');
  chrome.tabs.create({ url });
};

const ToolsComponent = ({ prebid }: ToolsComponentProps): JSX.Element => {
  const theme = useTheme();
  const [consoleState, setConsoleState] = useState<boolean>(null);

  useEffect(() => {
    chrome.storage.local.get(constants.CONSOLE_TOGGLE, (result) => {
      const checked = result ? result[constants.CONSOLE_TOGGLE] : false;
      setConsoleState(checked);
    });
  }, [consoleState]);

  const handleConsoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsoleState(event.target.checked);
    const { checked } = event.target;
    try {
      chrome.storage.local.set({ [constants.CONSOLE_TOGGLE]: checked }, () => {
        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
          const tab = tabs[0];
          logger.log('[PopupHandler] Send onConsoleToggle', { tab }, { type: constants.CONSOLE_TOGGLE, consoleState: checked });
          chrome.tabs.sendMessage(tab.id as number, { type: constants.CONSOLE_TOGGLE, consoleState: checked });
        });
      });
    } catch (e) {
      logger.error('onConsoleToggle', e);
    }
  };
  logger.log(`[PopUp][ToolsComponent]: render `, consoleState);
  return (
    <Grid container direction="row" justifyContent="flex-start" spacing={1} sx={{ p: 1 }}>
      <Grid item>
        <Paper elevation={1}>
          <Button size="small" variant="outlined" onClick={dfp_open_console} startIcon={<FontAwesomeIcon icon={faGoogle} />}>
            open google AdManager console
          </Button>
        </Paper>
      </Grid>
      <Grid item>
        <Paper elevation={1}>
          <Button size="small" variant="outlined" onClick={openDebugTab} startIcon={<BugReportIcon />}>
            open debug tab
          </Button>
        </Paper>
      </Grid>
      <Grid item>
        <Paper elevation={1}>
          <Button size="small" variant="outlined" onClick={() => chrome.storage?.local.set({ tabInfos: null })} startIcon={<DeleteOutlineIcon />}>
            delete tabInfos
          </Button>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Grid container rowSpacing={0.5} columnSpacing={0.25} sx={{ borderRadius: 1, backgroundColor: 'background.paper', p: 1 }}>
          {prebid && <ModifyBidResponsesComponent prebid={prebid} />}
          <Grid item sm={1} xs={1}>
            <Box sx={{ alignContent: 'center', [theme.breakpoints.down('sm')]: { transform: 'rotate(90deg)' } }}>
              <FormControl>
                <FormControlLabel control={<Switch checked={consoleState || false} onChange={handleConsoleChange} />} label="" />
              </FormControl>
            </Box>
          </Grid>
          <Grid item xs={11} sm={11}>
            <Box sx={{ border: 1, borderColor: consoleState ? 'primary.main' : 'text.disabled', borderRadius: 1 }}>
              <Typography component="div" sx={{ width: 1, p: 1.5, color: consoleState ? 'text' : 'text.disabled' }}>
                Show AdUnit Info Overlay
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

interface ToolsComponentProps {
  prebid: IPrebidDetails;
}

export default ToolsComponent;
