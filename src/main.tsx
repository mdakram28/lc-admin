import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@emotion/react';
import App from './App';
import theme from './theme';
import { HashRouter } from 'react-router-dom';
import { Experimental_CssVarsProvider as CssVarsProvider } from "@mui/material";

// @ts-ignore
Number.prototype.mod = function (n) {
  "use strict";
  // @ts-ignore
  return ((this % n) + n) % n;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <HashRouter>
      <CssVarsProvider>
        <App />
      </CssVarsProvider>
    </HashRouter>
  </>,
);
