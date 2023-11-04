const config = {
  lineaRpcUrl: process.env.LINEA_RPC_URL || "https://rpc.goerli.linea.build",
  foxSkinContractAddress: process.env.FOX_SKIN_CONTRACT_ADDRESS || "0xcff04746ac2D0eeB133E6d5b3171cE37E08d71dD",
  maxNftSkinId: Number(process.env.MAX_NFT_SKIN_ID) || 1,
}

export default config