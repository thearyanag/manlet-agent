from typing import Dict, Any, Union
from decimal import Decimal
import subprocess
import json
from openai import OpenAI
from swarm import Agent
import os
# from .env file
wallet_address = os.getenv("WALLET_ADDRESS")

#load openai api key from .env file
openai_api_key = os.getenv("OPENAI_API_KEY")

class SwarmActionsBridge:
    def __init__(self, node_server_url: str = "http://localhost:3000"):
        """
        Initialize the bridge with OpenAI swarm and custom actions support
        """
        self.node_server_url = node_server_url  
        self.openai_client = OpenAI(api_key=openai_api_key)

    def _execute_js_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a JavaScript action using Node.js"""
        try:
            # Create temporary command that imports and calls the action
            command = f"""
            import {{ {action} }} from './actions';
            
            async function run() {{
                try {{
                    const result = await {action}({json.dumps(params)});
                    console.log(JSON.stringify(result));
                }} catch (error) {{
                    console.error(JSON.stringify({{ error: error.message }}));
                    process.exit(1);
                }}
            }}
            
            run();
            """
            
            # Save command to temporary file
            with open('temp_command.mjs', 'w') as f:
                f.write(command)
            
            # Execute with Node.js
            result = subprocess.run(
                ['node', 'temp_command.mjs'],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(result.stderr)
                
            return json.loads(result.stdout)
            
        except Exception as e:
            raise Exception(f"Failed to execute JavaScript action: {str(e)}")

    # Token Operations
    def create_token(self, name: str, symbol: str, initial_supply: int) -> str:
        """Create new token using custom implementation"""
        try:
            params = {
                "name": name,
                "symbol": symbol,
                "initialSupply": initial_supply
            }
            result = self._execute_js_action("createToken", params)
            return f"Token created: {result}"
        except Exception as e:
            return f"Error creating token: {str(e)}"

    def transfer_asset(self, amount: Union[int, float, Decimal], asset_id: str, destination_address: str) -> str:
        """Transfer assets using custom implementation"""
        try:
            params = {
                "amount": float(amount),
                "assetId": asset_id,
                "destinationAddress": destination_address
            }
            result = self._execute_js_action("transferAsset", params)
            return f"Asset transferred: {result}"
        except Exception as e:
            return f"Error transferring asset: {str(e)}"

    def get_balance(self, asset_id: str) -> str:
        """Get balance using custom implementation"""
        try:
            params = {"assetId": asset_id}
            result = self._execute_js_action("getBalance", params)
            return f"Balance: {result}"
        except Exception as e:
            return f"Error getting balance: {str(e)}"

    def deploy_nft(self, name: str, symbol: str, base_uri: str) -> str:
        """Deploy NFT contract using custom implementation"""
        try:
            params = {
                "name": name,
                "symbol": symbol,
                "baseUri": base_uri
            }
            result = self._execute_js_action("deployNFT", params)
            return f"NFT contract deployed: {result}"
        except Exception as e:
            return f"Error deploying NFT contract: {str(e)}"

    def mint_nft(self, contract_address: str, mint_to: str) -> str:
        """Mint NFT using custom implementation"""
        try:
            params = {
                "contractAddress": contract_address,
                "mintTo": mint_to
            }
            result = self._execute_js_action("mintNFT", params)
            return f"NFT minted: {result}"
        except Exception as e:
            return f"Error minting NFT: {str(e)}"

    def request_sol_from_faucet(self) -> str:
        """Request SOL from faucet"""
        try:
            result = self._execute_js_action("requestSolFromFaucet", {})
            return f"Faucet request completed: {result}"
        except Exception as e:
            return f"Error requesting from faucet: {str(e)}"

    def generate_art(self, prompt: str) -> str:
        """Generate art using DALL-E through OpenAI"""
        try:
            response = self.openai_client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            image_url = response.data[0].url
            return f"Generated artwork available at: {image_url}"
        except Exception as e:
            return f"Error generating artwork: {str(e)}"

# Initialize the bridge and create the agent
swarm_bridge = SwarmActionsBridge()

agent = Agent(
    name="Manlet",
    instructions="""You are a helpful agent that can interact onchain on the Solana blockchain using the funciton provided.
      You can create tokens, transfer assets, generate art, deploy NFTs, mint NFTs. 
      If you ever need to know your address, it is {wallet_address}. If you ever need funds, you can request them from the faucet.
        You can also deploy your own spl tokens, NFTs, and interact with them. If someone asks you to do something you can't do, you can say so,
          and encourage them to implement it themselves in the actions.ts file. 
          You can also offer to help them implement it by writing the function and telling them to add it to the agent.py file and 
          within your list of callable functions..""",
    functions=[
        swarm_bridge.create_token,
        swarm_bridge.transfer_asset,
        swarm_bridge.get_balance,
        swarm_bridge.request_sol_from_faucet,
        swarm_bridge.generate_art,
        swarm_bridge.deploy_nft,
        swarm_bridge.mint_nft
    ]
)