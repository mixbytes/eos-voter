import conf from '../config';
import Cookie from 'js-cookie'

const Eos = require('eosjs');

let cbCnt = 0;

class Auth {
    constructor() {
        if (window.scatter) {
            console.log('scatter loaded');
            this.scatter = window.scatter;

            this.scatter.requireVersion(5.0);
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

        this.selectedNet = Cookie.get('network') || conf.defaultNetwork;
        this.network = conf.network[this.selectedNet];

        this.eos = Eos.modules.api({
            chainId: this.network.chainId, httpEndpoint: this.network.protocol + '://' +
            this.network.host + this.network.port,
        });

        console.log(this.selectedNet);
    }

    scatter = null;
    identity = null;
    selectedAcc = 0;
    logged = false;

    onChangeNetCbs = new Map();

    removeOnChangeNet(idx) {
        this.onChangeNetCbs.delete(idx);
    }

    onChangeNet(cb) {
        this.onChangeNetCbs.set(cbCnt, cb);
        return cbCnt++;
    }

    async changeNetwork(net = 'jungle') {
        if (conf.network[net] === undefined)
            return;

        this.selectedNet = net;
        Cookie.set('network', net);

        this.afterLogin = new Promise((resolve) => {
            this.onLogin = resolve;
        });

        this.network = conf.network[net];

        this.identity = null;
        this.logged = false;

        this.eos = Eos.modules.api({
            chainId: this.network.chainId, httpEndpoint: this.network.protocol + '://' +
            this.network.host + this.network.port,
        });

        this.onChangeNetCbs.forEach(cb => cb());
    }

    async login() {
        if (!this.scatter) {
            console.log('Scatter not loaded');
            return false;
        }

        try {
            let forSuggest = {
                blockchain: 'eos',
                host: this.network.host,
                port: this.network.port,
                protocol: this.network.protocol,
                chainId: this.network.byChainId ? this.network.chainId : null
            };

            let t = await this.scatter.suggestNetwork(forSuggest);
            console.log('Suggest network: ', t);

          /*  let t = setTimeout(() => {
                if (!this.isLogged())
                    alert('Identity not found, check scatter');
            }, conf.scatterTimeout * 10);
            */

            this.identity = await this.scatter.getIdentity({accounts: [forSuggest]});

          //  clearTimeout(t);

            this.eos = this.scatter.eos(forSuggest, Eos, {chainId: this.network.chainId}, this.network.protocol);

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

        let balance = await this.eos.getCurrencyBalance('eosio.token', this.identity.accounts[this.selectedAcc].name, 'EOS');

        acc.balance = balance[0] ? balance[0] : '0.0000 EOS';

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
        let resp = await this.eos.getProducers({json: true, limit: 500});
        let prods = resp.rows;

        while (resp.more) {
            resp = await this.eos.getProducers({json: true, limit: 500, lower_bound: resp.more});
            prods = prods.concat(resp.rows);
        }

        return prods;
    }

    withEos(cb) {
        cb(this.eos);
    }

    isLogged() {
        return this.logged;
    }
}

export default new Auth();
