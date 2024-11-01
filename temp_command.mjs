
            import { deployNFT } from './actions';
            
            async function run() {
                try {
                    const result = await deployNFT({"name": "CreativeAgentNFT", "symbol": "CA", "baseUri": "https://example.com/nft"});
                    console.log(JSON.stringify(result));
                } catch (error) {
                    console.error(JSON.stringify({ error: error.message }));
                    process.exit(1);
                }
            }
            
            run();
            