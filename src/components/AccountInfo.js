import React from 'react';
import Card from "@material-ui/core/es/Card/Card";
import Typography from "@material-ui/core/es/Typography/Typography";
import Table from "@material-ui/core/es/Table/Table";
import TableRow from "@material-ui/core/es/TableRow/TableRow";
import CardHeader from "@material-ui/core/es/CardHeader/CardHeader";
import CardContent from "@material-ui/core/es/CardContent/CardContent";
import TableCell from "@material-ui/core/es/TableCell/TableCell";
import TableBody from "@material-ui/core/es/TableBody/TableBody";
import CardActions from "@material-ui/core/es/CardActions/CardActions";
import Button from "@material-ui/core/es/Button/Button";
import Dialog from "@material-ui/core/es/Dialog/Dialog";
import DialogTitle from "@material-ui/core/es/DialogTitle/DialogTitle";
import DialogContent from "@material-ui/core/es/DialogContent/DialogContent";
import DialogContentText from "@material-ui/core/es/DialogContentText/DialogContentText";
import TextField from "@material-ui/core/es/TextField/TextField";
import DialogActions from "@material-ui/core/es/DialogActions/DialogActions";
import Snackbar from "@material-ui/core/es/Snackbar/Snackbar";
import IconButton from "@material-ui/core/es/IconButton/IconButton";
import CloseIcon from '@material-ui/icons/Close';

import Auth from '../common/eos';

class StakeDialog extends React.Component {
    constructor(props) {
        super();

        this.state = {
            valid: false,
            errorText: props.fields.map(() => ''),
        };
        this.inps = {};
    }

    check(idx) {
        let errorText = this.state.errorText;
        errorText[idx] = this.props.fields[idx].checker(this.inps[idx].value);

        let valid = !!errorText.every(e => e === '');

        this.setState({
            errorText: errorText,
            valid: valid,
        });
    }

    formData() {
        let res = {};
        this.props.fields.forEach((f, idx) => res[f.name] = this.inps[idx].value);
        return res;
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
                            Enter the amount of money for stake.
                        </DialogContentText>
                        {this.props.fields.map((f, idx) => (
                            <TextField
                                key={idx}
                                inputRef={inp => this.inps[idx] = inp}
                                onChange={() => this.check(idx)}
                                helperText={this.state.errorText[idx]}
                                error={this.state.errorText[idx] !== ''}
                                margin="dense"
                                label={f.placeholder}
                                fullWidth
                                autoFocus
                            />
                        ))}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.props.onClose} color="primary">
                            Cancel
                        </Button>
                        <Button
                            disabled={!this.state.valid}
                            onClick={() => {
                                this.props.onOk(this.formData());
                            }}
                            color="primary">
                            Stake
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

class AccountInfo extends React.Component {
    constructor() {
        super();

        this.state = {
            data: [
                {key: "Account Name", value: '--'},
                {key: "Total Balance", value: '--'},
                {key: "Unstacked (liquid / for refund)", value: '--'},
                {key: "Stacked for CPU", value: '--'},
                {key: "Stacked for NET", value: '--'},
            ],

            openDialog: false,

            snackOpen: false,
            snackText: '',
            snackTimeout: null,
            snackAction: null,
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
        Auth.accountInfo().then(acc => {
            let totalBalance =
                parseFloat(acc.balance.split(' ')[0]) +
                parseFloat(acc.total_resources.cpu_weight.split(' ')[0]) +
                parseFloat(acc.total_resources.net_weight.split(' ')[0]);

            let forRefund = 0.0;
            if (acc.refund_request)
                forRefund = parseFloat(acc.refund_request.cpu_amount.split(' ')[0])
                    + parseFloat(acc.refund_request.net_amount.split(' ')[0]);

            totalBalance = (totalBalance + forRefund).toFixed(4);

            let data = this.state.data;
            data[0].value = acc.account_name;
            data[1].value = totalBalance + ' EOS';
            data[2].value = acc.balance + ' / ' + forRefund.toFixed(4) + ' EOS';
            data[3].value = acc.total_resources.cpu_weight;
            data[4].value = acc.total_resources.net_weight;

            this.setState({
                data: data,
                acc: acc,
            });
        });
    }

    stake(data) {
        this.setState({openDialog: false});

        Auth.withEos(eos => {
            eos.transaction(tr => {
                let method = 'delegatebw';
                let stake_cpu_field = 'stake_cpu_quantity';
                let stake_net_field = 'stake_net_quantity';
                if (data.net[0] === '-' && data.cpu[0] === '-' ) {
                    data.net = data.net.slice(1);
                    data.cpu = data.cpu.slice(1);
                    method = 'undelegatebw';
                    stake_cpu_field = 'un' + stake_cpu_field;
                    stake_net_field = 'un' + stake_net_field;
                }

                console.log(data);

                tr[method]({
                    from: this.state.acc.account_name,
                    receiver: this.state.acc.account_name,

                    [stake_cpu_field]: data.net + ' EOS',
                    [stake_net_field]: data.cpu + ' EOS',

                    transfer: 0
                }, {
                    authorization: this.state.acc.account_name
                });
            }).then(() => {
                this.showSnack("Success Stake", 1500);
                this.fetchData();
            }).catch((e) => {
                if (typeof e === 'string')
                    e = JSON.parse(e);
                this.showSnack("Fail Stake: " + e.message);
            })
        })
    }

    refund() {
        Auth.withEos(eos => {
            eos.transaction(tr => {
                tr.refund({
                    owner: this.state.acc.account_name,
                }, {
                    authorization: this.state.acc.account_name
                });
            }).then(() => {
                this.showSnack("Success Refund", 1500);
                this.fetchData();
            }).catch((e) => {
                if (typeof e === 'string')
                    e = JSON.parse(e);
                this.showSnack("Fail Refund: " + e.message);
            })
        })
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

    checker(val, required) {
        if (val === '')
            return !!required ? 'Field is required' : '';

        if (val.search(/^-?\d+\.\d{4}$/) === -1)
            return 'Required value with 4 decimals';

        return '';
    }

    render() {
        return (
            <Card>
                <CardHeader
                    title="Account Info"
                    subheader="Info about current account"
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
                    >Stake</Button>
                    <Button
                        color="primary"
                        variant="raised"
                        fullWidth
                        onClick={() => this.refund()}
                    >Refund</Button>
                </CardActions>

                <StakeDialog
                    open={this.state.openDialog}
                    onClose={() => this.setState({openDialog: false})}
                    onOk={(data) => this.stake(data)}
                    fields={[
                        {name: 'cpu', placeholder: 'CPU stake', checker: (val) => this.checker(val) },
                        {name: 'net', placeholder: 'NET stake', checker: (val) => this.checker(val) },
                    ]}
                    checker={(data) => this.check(data)}
                />

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

export default AccountInfo;