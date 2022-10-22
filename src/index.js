import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { createTheme, ThemeProvider } from "@material-ui/core/styles"

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


/// ****** HOSTING ****** ///
/// https://www.000webhost.com/members/website/sunset-ofer/files


const theme = createTheme({
  palette: {
    primary: {
      light: '#f6a85b',
      main: '#f49333',
      dark: '#aa6623',
      contrastText: '#fff',
    },
    secondary: {
      light: '#b9dfd7',
      main: '#a8d8ce',
      dark: '#759790',
      contrastText: '#000',
    },
  },
  overrides: {
    MuiCheckbox: {
      colorSecondary: {
        color: 'currentColor',
        '&$checked': {
        },
      },
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
     <ThemeProvider theme={theme}>
        <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
