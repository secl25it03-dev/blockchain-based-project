import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import deployedInfo from '../blockchain/deployedContract.json';

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  networkName: string;
  isConnecting: boolean;
  isConnected: boolean;
  hasMetaMask: boolean;
  contractAddress: string;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  donateNativeEth: (campaignId: string, donationRef: string, amountEth: string) => Promise<{ txHash: string; blockNumber: number }>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>('Hardhat Local / Demo Network');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const contractAddress = deployedInfo.contractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  const hasMetaMask = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';

  useEffect(() => {
    if (hasMetaMask) {
      const ethereum = (window as any).ethereum;

      // Handle accounts change
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      };

      // Handle chain change
      const handleChainChanged = (chainHex: string) => {
        const id = parseInt(chainHex, 16);
        setChainId(id);
        updateNetworkName(id);
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      }).catch(console.error);

      ethereum.request({ method: 'eth_chainId' }).then((hex: string) => {
        const id = parseInt(hex, 16);
        setChainId(id);
        updateNetworkName(id);
      }).catch(console.error);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [hasMetaMask]);

  const updateNetworkName = (id: number) => {
    switch (id) {
      case 1:
        setNetworkName('Ethereum Mainnet');
        break;
      case 11155111:
        setNetworkName('Sepolia Testnet');
        break;
      case 31337:
        setNetworkName('Hardhat Localhost (31337)');
        break;
      case 137:
        setNetworkName('Polygon Mainnet');
        break;
      case 80002:
        setNetworkName('Polygon Amoy Testnet');
        break;
      default:
        setNetworkName(`EVM Chain (ID: ${id})`);
    }
  };

  const connectWallet = async (): Promise<string | null> => {
    if (!hasMetaMask) {
      alert('MetaMask is not detected. Please install the MetaMask extension or use Demo/Sandbox payment mode.');
      return null;
    }

    try {
      setIsConnecting(true);
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        return accounts[0];
      }
      return null;
    } catch (err: any) {
      console.error('Wallet connection rejected:', err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  /**
   * Directly interacts with the smart contract to send a native ETH donation.
   */
  const donateNativeEth = async (
    campaignId: string,
    donationRef: string,
    amountEth: string
  ): Promise<{ txHash: string; blockNumber: number }> => {
    if (!hasMetaMask || !account) {
      throw new Error('Please connect your MetaMask wallet first.');
    }

    const ethereum = (window as any).ethereum;
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    const campaignIdBytes32 = ethers.id(campaignId);
    const contract = new ethers.Contract(contractAddress, deployedInfo.abi, signer);

    const tx = await contract.recordNativeDonation(campaignIdBytes32, donationRef, {
      value: ethers.parseEther(amountEth),
    });

    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        networkName,
        isConnecting,
        isConnected: !!account,
        hasMetaMask,
        contractAddress,
        connectWallet,
        disconnectWallet,
        donateNativeEth,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error('useWeb3 must be used within a Web3Provider');
  return context;
};
