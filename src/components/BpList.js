import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Checkbox from '@material-ui/core/Checkbox';
import {lighten} from '@material-ui/core/styles/colorManipulator';
import Card from "@material-ui/core/es/Card/Card";
import CardContent from "@material-ui/core/es/CardContent/CardContent";
import CardHeader from "@material-ui/core/es/CardHeader/CardHeader";
import CardActions from "@material-ui/core/es/CardActions/CardActions";
import Button from "@material-ui/core/es/Button/Button";
import TableHead from "@material-ui/core/es/TableHead/TableHead";
import Snackbar from "@material-ui/core/es/Snackbar/Snackbar";
import IconButton from "@material-ui/core/es/IconButton/IconButton";
import CloseIcon from '@material-ui/icons/Close';
import TableFooter from "@material-ui/core/es/TableFooter/TableFooter";
import TablePagination from "@material-ui/core/es/TablePagination/TablePagination";

import Auth from '../common/eos';

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
    },
    table: {
        minWidth: 1020,
    },
    listActions: {
        textAlign: "center"
    },
});

const toolbarStyles = theme => ({
    root: {
        paddingRight: theme.spacing.unit,
    },
    highlight:
        theme.palette.type === 'light'
            ? {
                color: theme.palette.secondary.main,
                backgroundColor: lighten(theme.palette.secondary.light, 0.85),
            }
            : {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.secondary.dark,
            },
    spacer: {
        flex: '1 1 100%',
    },
    actions: {
        color: theme.palette.text.secondary,
    },
    title: {
        flex: '0 0 auto',
    },
});

let TableToolbar = props => {
    const { classes, changed } = props;

    if (!changed)
        return null;

    return (
        <Toolbar className={classes.highlight}>
            <div className={classes.title}>
                {
                    Auth.isLogged() ? (
                        <Typography color="inherit" variant="subheading">
                            Vote set is changed, click "SAVE VOTES" for save
                        </Typography>
                    ) : (
                        <Typography color="inherit" variant="subheading">
                            For vote need login
                        </Typography>
                    )
                }
            </div>
        </Toolbar>
    );
};

TableToolbar.propTypes = {
    classes: PropTypes.object.isRequired,
    numSelected: PropTypes.number.isRequired,
};

TableToolbar = withStyles(toolbarStyles)(TableToolbar);

let isSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value));

class BpList extends React.Component {
    constructor() {
        super();

        this.state = {
            selected: new Set(),
            prevSelected: new Set(),
            producers: [],
            acc: null,

            snackOpen: false,
            snackText: '',
            snackTimeout: null,
            snackAction: null,

            tablePage: 0,
        };

        this.fetchData();

        Auth.accountInfo().then(() => {
            this.fetchData();
        });
    };

    componentDidMount() {
        this.onChangeNet = Auth.onChangeNet(() => {
            this.fetchData();
            Auth.accountInfo().then(() => {
                this.fetchData();
            });
        });
    }

    componentWillUnmount() {
        Auth.removeOnChangeNet(this.onChangeNet);
    }

    showSnack(text, timeout = null) {
        let action = null;

        if (timeout === null)
            action = (
                <IconButton
                    key="close"
                    aria-label="Close"
                    color="inherit"
                    onClick={() => this.setState({snackOpen: false})}>
                    <CloseIcon/>
                </IconButton>);

        this.setState({
            snackText: text,
            snackOpen: true,
            snackTimeout: timeout,
            snackAction: action,
        });
    }

    fetchData() {
        this.state.selected.clear();
        this.state.prevSelected.clear();

        let data = {
            acc: null,
            chainInfo: null,
            producers: null,
            selected: this.state.selected,
            prevSelected: this.state.prevSelected,
            myProducers: null,
        };

        Auth.chainInfo().then(chainInfo => {
            data.chainInfo = chainInfo;
            return Auth.getProducers();
        }).then(producers => {
            data.producers = producers;
            if (!Auth.isLogged())
                return null;
            return Auth.accountInfo();
        }).then(acc => {
            if (acc !== null) {
                acc.voter_info.producers.forEach(p => {
                    data.selected.add(p);
                    data.prevSelected.add(p);
                });
                data.myProducers = acc.voter_info.producers;
            }

            data.acc = acc;

            this.setState(data);
        });
    }

    totalVotes() {
        let total = 0;
        this.state.producers.forEach(p => total += parseFloat(p.total_votes));
        return total;
    }

    handleClick = (event, id) => {
        if (this.state.selected.has(id))
            this.state.selected.delete(id);
        else
            this.state.selected.add(id);

        this.setState({ selected: this.state.selected });
    };

    vote() {
        Auth.withEos(eos => {
            eos.transaction(tr => {
                tr.voteproducer({
                    voter: this.state.acc.account_name,
                    proxy: '',
                    producers: [...this.state.selected].sort()
                }, {
                    authorization: this.state.acc.account_name
                });
            }).then(() => {
                this.showSnack("Success Vote", 1500);
                this.fetchData();
            }).catch((e) => {
                if (typeof e === 'string')
                    e = JSON.parse(e);
                this.showSnack("Fail Vote: " + e.message);
            })
        });
    }

    render() {
        const { classes } = this.props;

        return (
            <Card className={classes.root}>
                <CardHeader
                    title="Block Producers List"
                />
                <CardContent>
                    <TableToolbar
                        changed={!isSetsEqual(this.state.selected, this.state.prevSelected)}
                        numSelected={this.state.selected.size}
                        onClick={() => {
                            this.state.selected.clear();
                            this.setState({selected: this.state.selected})
                        }}
                    />
                    <Table className={classes.table} aria-labelledby="tableTitle">
                        <TableHead>
                            <TableRow>
                                <TableCell>Vote</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Url</TableCell>
                                <TableCell>Total votes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.state.producers.slice(10 * this.state.tablePage, 10 * this.state.tablePage + 10).map((n, idx) => {
                                return (
                                    <TableRow
                                        hover
                                        role="checkbox"
                                        aria-checked={false}
                                        tabIndex={-1}
                                        key={idx}
                                        selected={this.state.selected.has(n.owner)}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={this.state.selected.has(n.owner)}
                                                onClick={event => this.handleClick(event, n.owner)}
                                            />
                                        </TableCell>
                                        <TableCell>{n.owner}</TableCell>
                                        <TableCell><a href={n.url} target="_blank">{n.url}</a></TableCell>
                                        <TableCell>{
                                            (n.total_votes / Auth.voteWeight() / 10000.0).toFixed() + ' EOS / '
                                            + (n.total_votes / this.totalVotes() * 100).toFixed(2) + '%'
                                        }
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    colSpan={5}
                                    count={this.state.producers.length}
                                    rowsPerPageOptions={[]}
                                    rowsPerPage={10}
                                    page={this.state.tablePage}
                                    onChangePage={(ev, page) => { this.setState({tablePage: page})}}
                                />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
                <CardActions className={classes.listActions}>
                    <Button
                        color="primary"
                        variant="raised"
                        size="large"
                        fullWidth
                        disabled={!Auth.isLogged() || isSetsEqual(this.state.selected, this.state.prevSelected)}
                        onClick={() => this.vote()}
                    >
                        SAVE VOTES
                    </Button>
                </CardActions>

                <Snackbar
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={this.state.snackOpen}
                    ContentProps={{
                        'aria-describedby': 'message-id',
                    }}
                    message={<span id="message-id">{this.state.snackText}</span>}
                    action={this.state.snackAction}
                    autoHideDuration={this.state.snackTimeout}
                    onClose={() => this.setState({snackOpen: false})}
                />
            </Card>
        );
    }
}

BpList.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(BpList);