import { 
    createUmi } from '@metaplex-foundation/umi-bundle-defaults';
  import { 
    create } from '@metaplex-foundation/mpl-core';
  import {
    createGenericFile,
    generateSigner,
    signerIdentity,
    sol,
    Umi
  } from '@metaplex-foundation/umi';
  import { base58 } from '@metaplex-foundation/umi/serializers';
  import { 
    createMint,
    createAssociatedTokenAccount,
    getOrCreateAssociatedTokenAccount,
    getAccount,
    mintTo,
    transfer
  } from '@solana/spl-token';
  import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
  import fs from 'fs';
  import path from 'path';
  import OpenAI from 'openai';

  // load the wallet from the keypair.json file
  const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync('keypair.json', 'utf8'))));
  
  // load the openai api key from the .env file
  const openai_api_key = process.env.OPENAI_API_KEY;

  class SolanaSwarmOperations {

    connection: Connection;
    umi: Umi;
    openai: OpenAI;

    constructor(rpcUrl = 'https://api.devnet.solana.com') {
      this.connection = new Connection(rpcUrl);
      this.umi = createUmi(rpcUrl);
      this.openai = new OpenAI({ apiKey: openai_api_key });
    }
  
    // Token Operations
    async createToken(name, symbol, initialSupply) {
      try {
        // Request airdrop for token creation
        const airdropSignature = await this.connection.requestAirdrop(
          keypair.publicKey,
          LAMPORTS_PER_SOL
        );
        await this.connection.confirmTransaction(airdropSignature);
  
        // Create new token mint
        const mint = await createMint(
          this.connection,
          keypair,
          keypair.publicKey,
          keypair.publicKey,
          9 // 9 decimals is standard for SPL tokens
        );
  
        // Create associated token account
        const tokenAccount = await createAssociatedTokenAccount(
          this.connection,
          keypair,
          mint,
          keypair.publicKey
        );
  
        // Mint initial supply
        await mintTo(
          this.connection,
          keypair,
          mint,
          tokenAccount,
          keypair,
          initialSupply
        );
  
        return {
          tokenMint: mint.toString(),
          tokenAccount: tokenAccount.toString()
        };
      } catch (error) {
        throw new Error(`Error creating token: ${error.message}`);
      }
    }
  
    async transferAsset(amount, assetId, destinationAddress) {
      try {
        const mintPublicKey = new PublicKey(assetId);
        const destinationPublicKey = new PublicKey(destinationAddress);
  
        // Get or create associated token account for destination
        const destinationAccount = await getOrCreateAssociatedTokenAccount(
          this.connection,
          keypair,
          mintPublicKey,
          destinationPublicKey
        );
  
        // Perform transfer
       let sig =  await transfer(
          this.connection,
          keypair,
          mintPublicKey,
          destinationAccount.address,
          keypair,
          amount
        );
  
        return {
          success: true,
          signature: sig
        };
      } catch (error) {
        throw new Error(`Error transferring asset: ${error.message}`);
      }
    }
  
    async getBalance(assetId) {
      try {
        const account = await getAccount(
          this.connection,
          new PublicKey(assetId)
        );
        return account.amount.toString();
      } catch (error) {
        throw new Error(`Error getting balance: ${error.message}`);
      }
    }
  
    // NFT Operations
    async deployNFT(name, symbol, baseUri) {
      try {
        const signer = generateSigner(this.umi);
        this.umi.use(signerIdentity(signer));
  
        // Request SOL for deployment
        await this.umi.rpc.airdrop(this.umi.identity.publicKey, sol(1));
  
        const asset = generateSigner(this.umi);
        
        const tx = await create(this.umi, {
          asset,
          name,
          uri: baseUri,
        }).sendAndConfirm(this.umi);
  
        const signature = base58.deserialize(tx.signature)[0];
  
        return {
          address: asset.publicKey.toString(),
          signature,
          explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
        };
      } catch (error) {
        throw new Error(`Error deploying NFT: ${error.message}`);
      }
    }
  
    async mintNFT(contractAddress, mintTo) {
      try {
        // Using the example code structure provided
        const signer = generateSigner(this.umi);
        this.umi.use(signerIdentity(signer));
  
        // Upload image to Arweave (assuming image.png exists in root directory)
        const imageFile = fs.readFileSync(path.join('./image.png'));
        const umiImageFile = createGenericFile(imageFile, 'image.png', {
          tags: [{ name: 'Content-Type', value: 'image/png' }],
        });
  
        const imageUri = await this.umi.uploader.upload([umiImageFile]);
  
        // Create metadata
        const metadata = {
          name: 'Generated NFT',
          description: 'NFT minted through Solana Swarm',
          image: imageUri[0],
          attributes: [],
          properties: {
            files: [{ uri: imageUri[0], type: 'image/png' }],
            category: 'image',
          },
        };
  
        const metadataUri = await this.umi.uploader.uploadJson(metadata);
  
        // Create NFT
        const asset = generateSigner(this.umi);
        const tx = await create(this.umi, {
          asset,
          name: metadata.name,
          uri: metadataUri,
        }).sendAndConfirm(this.umi);
  
        const signature = base58.deserialize(tx.signature)[0];
  
        return {
          tokenId: asset.publicKey.toString(),
          signature,
          metadataUri,
          explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
        };
      } catch (error) {
        throw new Error(`Error minting NFT: ${error.message}`);
      }
    }
  
    // Utilities
    async requestSolFromFaucet() {
      try {
        const signature = await this.connection.requestAirdrop(
          keypair.publicKey,
          LAMPORTS_PER_SOL
        );
        await this.connection.confirmTransaction(signature);
        
        return {
          address: keypair.publicKey.toString(),
          amount: LAMPORTS_PER_SOL,
          signature
        };
      } catch (error) {
        throw new Error(`Error requesting SOL: ${error.message}`);
      }
    }
  
    async generateArt(prompt) {
      try {
        const response = await this.openai.images.generate({
          prompt,
          n: 1,
          size: "1024x1024",
        });
  
        return {
          imageUrl: response.data[0].url,
          prompt
        };
      } catch (error) {
        throw new Error(`Error generating art: ${error.message}`);
      }
    }
  }
  
  export default SolanaSwarmOperations;