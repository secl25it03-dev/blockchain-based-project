const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying DonatoDonationRegistry with account:", deployer.address);

  // In production / testnet, registrar can be a dedicated backend relayer wallet.
  // For local development, deployer acts as both admin and registrar.
  const registrarAddress = process.env.REGISTRAR_ADDRESS || deployer.address;

  const DonatoDonationRegistry = await hre.ethers.getContractFactory("DonatoDonationRegistry");
  const registry = await DonatoDonationRegistry.deploy(deployer.address, registrarAddress);
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("DonatoDonationRegistry deployed successfully to:", contractAddress);

  // Save deployment artifact info for backend and frontend
  const deploymentInfo = {
    contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    registrar: registrarAddress,
  };

  const artifactPath = path.join(__dirname, "../artifacts/contracts/DonatoDonationRegistry.sol/DonatoDonationRegistry.json");
  let artifactData = {};
  if (fs.existsSync(artifactPath)) {
    const raw = fs.readFileSync(artifactPath, "utf-8");
    artifactData = JSON.parse(raw);
  }

  const exportData = {
    ...deploymentInfo,
    abi: artifactData.abi,
  };

  // Write to blockchain/deployedContract.json
  const deployedOutPath = path.join(__dirname, "../deployedContract.json");
  fs.writeFileSync(deployedOutPath, JSON.stringify(exportData, null, 2));
  console.log("Deployment details saved to:", deployedOutPath);

  // Also write into backend/src/blockchain/deployedContract.json
  const backendDir = path.join(__dirname, "../../backend/src/blockchain");
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
  fs.writeFileSync(path.join(backendDir, "deployedContract.json"), JSON.stringify(exportData, null, 2));

  // Also write into frontend/src/blockchain/deployedContract.json
  const frontendDir = path.join(__dirname, "../../frontend/src/blockchain");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  fs.writeFileSync(path.join(frontendDir, "deployedContract.json"), JSON.stringify(exportData, null, 2));

  console.log("Shared deployedContract.json synced to backend and frontend.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
