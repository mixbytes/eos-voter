import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles/index';
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";

import BpList from './components/BpList';
import ChainInfo from "./components/ChainInfo";
import AccountInfo from './components/AccountInfo';

import {
    Button,
    CloseIcon,
    AppBar,
    Toolbar,
    Typography,
} from "@material-ui/core/index";

import Auth from './common/eos';

const styles = {
    root: {
        flexGrow: 1,
    },
    content: {
        padding: 10
    },
    info: {
        display: "grid",
        gridTemplate: "repeat(1, 1fr) / repeat(2, 1fr)",
        gridGap: "10px",
    },
    flex: {
        flex: 1,
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
};

const theme = createMuiTheme({
    palette: {
        primary: { main: '#481f80' }, // Purple and green play nicely together.
    },
});

class App extends React.Component {
    componentDidMount() {
        this.onChangeNet = Auth.onChangeNet(() => {this.forceUpdate()});
    }

    componentWillUnmount() {
        Auth.removeOnChangeNet(this.onChangeNet);
    }

    render() {
        const {classes} = this.props;
        return (
            <MuiThemeProvider theme={theme}>
                <div className={classes.root}>
                    <AppBar position="static">
                        <Toolbar>
                            <Typography variant="title" color="inherit" className={classes.flex}>
                                EOS vote tool
                            </Typography>
                            {
                                !Auth.isLogged() ? (
                                    <Button color="inherit" onClick={() => {
                                        Auth.login().then(() => this.forceUpdate());
                                    }}>Login with Scatter</Button>
                                ) : null
                            }
                        </Toolbar>
                    </AppBar>

                    <div className={classes.content}>
                        {
                            Auth.isLogged() ? (
                                <div className={classes.info}>
                                    <AccountInfo/>
                                    <ChainInfo/>
                                </div>
                            ) : (
                                <ChainInfo/>
                            )
                        }
                        <BpList/>
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

App.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(App);