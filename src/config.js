export default {
    network: {
        jungle: {
            name: 'Jungle Testnet',
            chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca',
            host: "dev.cryptolions.io",
            port: "38888",
            protocol: "http",
            byChainId: false
        },

        mainnet: {
            name: 'MainNet',
            chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
            host: "api.tokenika.io",
            port: "443",
            protocol: "https",
            byChainId: true
        }
    },
    defaultNetwork: 'mainnet',
//    scatterTimeout: 1000,
};