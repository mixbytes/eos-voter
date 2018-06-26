export default {
    network: {
        jungle: {
            name: 'Jungle Testnet',
            chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca',
            host: "79.137.175.6",
            port: "8888",
            protocol: "http",
            byChainId: true
        },

        mainnet: {
            name: 'MainNet',
            chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
            host: "79.137.175.6",
            port: "18888",
            protocol: "http",
            byChainId: true
        }
    },
    defaultNetwork: 'mainnet',
};