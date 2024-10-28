// server.ts
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import SolanaSwarmOperations from "./actions";

const app = express();
const port: number = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Solana operations
const swarmOps = new SolanaSwarmOperations(
  ""
);

// Define Interfaces for Request Bodies
interface CreateTokenRequest {
  name: string;
  symbol: string;
  initialSupply: number;
}

interface TransferAssetRequest {
  amount: number;
  assetId: string;
  destinationAddress: string;
}

interface GetBalanceRequest {
  assetId: string;
}

interface DeployNFTRequest {
  name: string;
  symbol: string;
  baseUri: string;
}

interface MintNFTRequest {
  contractAddress: string;
  mintTo: string;
}

interface GenerateArtRequest {
  prompt: string;
}

// Define Interfaces for Responses
interface GenericResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Token Operations
app.post(
  "/create-token",
  async (
    req: Request<{}, GenericResponse, CreateTokenRequest>,
    res: Response<GenericResponse>
  ) => {
    try {
      const { name, symbol, initialSupply } = req.body;
      const result = await swarmOps.createToken(name, symbol, initialSupply);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

app.post(
  "/transfer-asset",
  async (
    req: Request<{}, GenericResponse, TransferAssetRequest>,
    res: Response<GenericResponse>
  ) => {
    try {
      const { amount, assetId, destinationAddress } = req.body;
      const result = await swarmOps.transferAsset(
        amount,
        assetId,
        destinationAddress
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

app.post(
  "/get-balance",
  async (
    req: Request<{}, { balance: string }, GetBalanceRequest>,
    res: Response<{ balance: string } | { error: string }>
  ) => {
    try {
      const { assetId } = req.body;
      const result = await swarmOps.getBalance(assetId);
      res.json({ balance: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// NFT Operations
app.post(
  "/deploy-nft",
  async (
    req: Request<{}, GenericResponse, DeployNFTRequest>,
    res: Response<GenericResponse>
  ) => {
    try {
      const { name, symbol, baseUri } = req.body;
      const result = await swarmOps.deployNFT(name, symbol, baseUri);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

app.post(
  "/mint-nft",
  async (
    req: Request<{}, GenericResponse, MintNFTRequest>,
    res: Response<GenericResponse>
  ) => {
    try {
      const { contractAddress, mintTo } = req.body;
      const result = await swarmOps.mintNFT(contractAddress, mintTo);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Utilities
app.post(
  "/request-sol",
  async (req: Request, res: Response<GenericResponse>) => {
    try {
      const result = await swarmOps.requestSolFromFaucet();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

app.post(
  "/generate-art",
  async (
    req: Request<{}, GenericResponse, GenerateArtRequest>,
    res: Response<GenericResponse>
  ) => {
    try {
      const { prompt } = req.body;
      const result = await swarmOps.generateArt(prompt);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
