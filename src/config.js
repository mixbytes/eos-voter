export default {
    network: {
        jungle: {
            name: 'Jungle Testnet',
            chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca',
            host: "eos-voting.smartz.io/api/jungle",
            port: "",
            protocol: "https",
            byChainId: true,
            featuredBps: ['okapitestnet', 'komododragon'],
        },

        mainnet: {
            name: 'MainNet',
            chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
            host: "eos-voting.smartz.io/api/mainnet",
            port: "",
            protocol: "https",
            byChainId: true,
            featuredBps: ['mixbytevaran', 'mixbytes1234'],
        }
    },
    defaultNetwork: 'mainnet',
};
