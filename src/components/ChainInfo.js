import React from 'react';
import Card from "@material-ui/core/es/Card/Card";
import Typography from "@material-ui/core/es/Typography/Typography";
import withStyles from "@material-ui/core/es/styles/withStyles";
import Table from "@material-ui/core/es/Table/Table";
import TableRow from "@material-ui/core/es/TableRow/TableRow";
import CardHeader from "@material-ui/core/es/CardHeader/CardHeader";
import CardContent from "@material-ui/core/es/CardContent/CardContent";
import TableCell from "@material-ui/core/es/TableCell/TableCell";
import TableBody from "@material-ui/core/es/TableBody/TableBody";

import Auth from '../common/eos';
import DialogActions from "@material-ui/core/es/DialogActions/DialogActions";
import Button from "@material-ui/core/es/Button/Button";
import CardActions from "@material-ui/core/es/CardActions/CardActions";
import Dialog from "@material-ui/core/es/Dialog/Dialog";
import DialogTitle from "@material-ui/core/es/DialogTitle/DialogTitle";
import DialogContent from "@material-ui/core/es/DialogContent/DialogContent";
import DialogContentText from "@material-ui/core/es/DialogContentText/DialogContentText";
import TextField from "@material-ui/core/es/TextField/TextField";
import Select from "@material-ui/core/es/Select/Select";
import MenuItem from "@material-ui/core/es/MenuItem/MenuItem";

const styles = theme => ({
    root: {
    },
    actions: {
        float: "right",
    }
});


class ChangeNetDialog extends React.Component {
    constructor(props) {
        super();

        this.state = {
            valid: false,
            errorText: props.fields.map(() => ''),

            selected: Auth.selectedNet
        };
        this.inps = {};
    }

    formData() {
        return this.props.fields.find(f => f.id === this.state.selected).id;
    }

    render() {
        return (
            <div>
                <Dialog
                    open={this.props.open}
                    aria-labelledby="stake-dialog-title"
                >
                    <DialogTitle id="stake-dialog-title">Stake</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Select network for voting.
                        </DialogContentText>
                        <Select
                            value={this.state.selected}
                            fullWidth
                            onChange={(ev) => {this.setState({selected: ev.target.value})}}
                            inputProps={{
                                name: 'network',
                                id: 'network',
                            }}
                        >
                            {this.props.fields.map((f, idx) => (
                                <MenuItem value={f.id} key={idx}>{f.name}</MenuItem>
                            ))}
                        </Select>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.props.onClose} color="primary">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                this.props.onOk(this.formData());
                            }}
                            color="primary">
                            Ok
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

class ChainInfo extends React.Component {
    constructor() {
        super();

        this.state = {
            data: [
                {key: "Network", value: "--"},
                {key: "Current chain", value: "--"},
                {key: "Chain ID", value: "--"},
                {key: "Total voted", value: "--"},
                {key: "Total voted %", value: "--"},
            ],

            openDialog: false
        };

        this.fetchData();
    }

    componentDidMount() {
        this.onChangeNet = Auth.onChangeNet(() => {this.fetchData()});
    }

    componentWillUnmount() {
        Auth.removeOnChangeNet(this.onChangeNet);
    }

    fetchData() {
        Auth.chainInfo().then(info => {
            let data = this.state.data;

            data[0].value = info.name;
            data[1].value = info.host + ':' + info.port;
            data[2].value = info.chain_id.substr(0, 35) + '...';
            data[3].value = (info.total_activated_stake / 10000).toFixed(4) + ' EOS';
            data[4].value = (info.total_activated_stake / 10000000000000 * 100).toFixed(3) + ' %';

            this.setState({data: data});
        });
    }

    render() {
        const { classes } = this.props;

        return (
            <Card className={classes.root}>
                <CardHeader
                    title="Chain Info"
                    subheader="Info about current chain"
                />
                <CardContent>
                    <Table>
                        <TableBody>
                        {this.state.data.map((item, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    <Typography>{item.key}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography>{item.value}</Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>

                <CardActions>
                    <Button
                        color="primary"
                        variant="raised"
                        fullWidth
                        onClick={() => this.setState({openDialog: true})}
                    >Change Network</Button>
                </CardActions>

                <ChangeNetDialog
                    open={this.state.openDialog}
                    onClose={() => this.setState({openDialog: false})}
                    onOk={(data) => { Auth.changeNetwork(data); this.setState({openDialog: false}) }}
                    fields={[
                        {id: 'jungle', name: 'Jungle Testnet'},
                        {id: 'mainnet', name: 'Mainnet'},
                    ]}
                    checker={(data) => this.check(data)}
                />
            </Card>
        );
    }
}

export default withStyles(styles)(ChainInfo);