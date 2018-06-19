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

const styles = theme => ({
    root: {
    },
    actions: {
        float: "right",
    }
});

class ChainInfo extends React.Component {
    constructor() {
        super();

        this.state = {
            data: [
                {key: "Current chain", value: "--"},
                {key: "Chain ID", value: "--"},
                {key: "Total voted", value: "--"},
                {key: "Total voted %", value: "--"},
            ],
        };

        this.fetchData();
    }

    fetchData() {
        Auth.chainInfo().then(info => {
            let data = this.state.data;

            data[0].value = info.host + ':' + info.port;
            data[1].value = info.chain_id.substr(0, 35) + '...';
            data[2].value = (info.total_activated_stake / 10000).toFixed(4) + ' EOS';
            data[3].value = (info.total_activated_stake / 10000000000000 * 100).toFixed(3) + ' %';

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
            </Card>
        );
    }
}

export default withStyles(styles)(ChainInfo);