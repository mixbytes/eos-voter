import conf from '../config';
const Eos = require('eosjs');

class Auth {
    constructor() {
        if (window.scatter) {
            console.log('scatter loaded');
            this.scatter = window.scatter;

            this.scatter.requireVersion(4.0);
        }
        else {
            document.addEventListener('scatterLoaded', () => {
                console.log('scatter loaded');
                this.scatter = window.scatter;

                this.scatter.requireVersion(4.0);
            });
        }

        this.afterLogin = new Promise((resolve) => {
            this.onLogin = resolve;
        });
    }

    network = {
        blockchain:'eos',
        host: conf.host,
        port: conf.port,
        protocol: conf.protocol
    };

    eos = Eos.modules.api({
        chainId: conf.chainId, httpEndpoint: conf.protocol + '://' +
                this.network.host + ':' +this.network.port,
    });

    scatter = null;
    identity = null;
    selectedAcc = 0;
    logged = false;

    async login() {
        if (!this.scatter) {
            console.log('Scatter not loaded');
            return false;
        }

        try {
            await this.scatter.suggestNetwork(this.network);
            console.log('Suggest network OK');

            this.identity = await this.scatter.getIdentity({accounts: [this.network]});
            this.eos = this.scatter.eos(this.network, Eos, {chainId: conf.chainId}, conf.protocol);

            this.onLogin();
            this.logged = true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async accountInfo() {
        await this.afterLogin;

        let acc = await this.eos.getAccount(this.identity.accounts[this.selectedAcc].name);

        let balanceRows = await this.eos.getTableRows({
            json: true,
            code: 'eosio.token',
            scope: this.identity.accounts[this.selectedAcc].name,
            table: 'accounts',
            limit: 500
        });

        let row = balanceRows.rows.find(r => r.balance.endsWith('EOS'));
        acc.balance = row.balance;

        return acc;
    }

    async chainInfo() {
        let res = this.network;
        let info = await this.eos.getInfo({});
        let glob = (await this.eos.getTableRows({'json': true, 'code': 'eosio', 'scope': 'eosio', 'table': 'global'})).rows[0];

        res = Object.assign(Object.assign(res, info), glob);

        return res;
    }

    voteWeight() {
        let timestamp_epoch = 946684800000;
        let dates_ = (Date.now() / 1000) - (timestamp_epoch / 1000);
        let weight_ = Math.floor(dates_ / (86400 * 7)) / 52;  //86400 = seconds per day 24*3600
        return Math.pow(2, weight_);
    }

    async getProducers() {
        return (await this.eos.getProducers({json: true, limit: 1000})).rows;
    }

    withEos(cb) {
        cb(this.eos);
    }

    isLogged() {
        return this.logged;
    }
}

export default new Auth();