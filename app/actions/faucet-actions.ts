"use server";

import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";

// Constants
const FAUCET_AMOUNT = "0.05"; // Amount of ETH to send
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_RECENT_TXS = 10; // Number of recent transactions to store

// Sepolia RPC endpoints (in order of preference)
const RPC_ENDPOINTS = [
  process.env.SEPOLIA_RPC_URL, // Custom RPC URL if provided
];

// In-memory storage (note: this will reset on server restart)
// For a production app, use a proper database
let transactionHistory: Transaction[] = [];
const cooldowns = new Map<string, number>();

// Types
type Transaction = {
  id: string;
  address: string;
  txHash: string;
  amount: string;
  timestamp: number;
};

type SendEthResult = {
  success: boolean;
  txHash?: string;
  error?: string;
};

// Helper function to check if an address is on cooldown
async function isOnCooldown(address: string): Promise<boolean> {
  const lastRequest = cooldowns.get(address.toLowerCase());
  if (!lastRequest) return false;

  const now = Date.now();
  return now - lastRequest < COOLDOWN_PERIOD;
}

// Helper function to set cooldown for an address
async function setCooldown(address: string): Promise<void> {
  cooldowns.set(address.toLowerCase(), Date.now());
}

// Helper function to add a transaction to history
async function addTransaction(
  address: string,
  txHash: string,
  amount: string
): Promise<void> {
  const tx: Transaction = {
    id: uuidv4(),
    address,
    txHash,
    amount,
    timestamp: Date.now(),
  };

  // Add to recent transactions list
  transactionHistory.unshift(tx);

  // Keep only the most recent transactions
  if (transactionHistory.length > MAX_RECENT_TXS) {
    transactionHistory = transactionHistory.slice(0, MAX_RECENT_TXS);
  }
}

// Helper function to get a working provider
async function getWorkingProvider(): Promise<ethers.JsonRpcProvider | null> {
  // Filter out undefined/null RPC URLs
  const endpoints = RPC_ENDPOINTS.filter(Boolean) as string[];

  for (const rpcUrl of endpoints) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test the provider with a simple call
      await provider.getBlockNumber();
      console.log(`Connected to RPC endpoint: ${rpcUrl}`);
      return provider;
    } catch (error) {
      console.warn(`Failed to connect to RPC endpoint ${rpcUrl}:`, error);
      // Continue to the next endpoint
    }
  }

  return null;
}

// Main function to send ETH
export async function sendEth(address: string): Promise<SendEthResult> {
  // Validate address format
  if (!ethers.isAddress(address)) {
    return { success: false, error: "Invalid Ethereum address" };
  }

  // Check cooldown
  if (await isOnCooldown(address)) {
    return {
      success: false,
      error: "This address has already received ETH in the last 24 hours",
    };
  }

  try {
    // Get a working provider
    const provider = await getWorkingProvider();

    if (!provider) {
      return {
        success: false,
        error: "Failed to connect to Sepolia network. Please try again later.",
      };
    }

    // Initialize wallet with the provider
    const wallet = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY!, provider);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    const requiredAmount = ethers.parseEther(FAUCET_AMOUNT);

    if (balance < requiredAmount) {
      return {
        success: false,
        error: "The faucet is out of funds. Please contact the administrator.",
      };
    }

    // Send transaction
    const tx = await wallet.sendTransaction({
      to: address,
      value: requiredAmount,
    });

    console.log(`Transaction sent: ${tx.hash}`);

    // Wait for transaction to be mined (with timeout)
    const receipt = await Promise.race([
      tx.wait(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 30000)), // 30 second timeout
    ]);

    if (!receipt) {
      // Transaction didn't fail but took too long to confirm
      // We'll still consider it a success since it was submitted
      console.log(
        `Transaction ${tx.hash} submitted but confirmation timed out`
      );

      await setCooldown(address);
      await addTransaction(address, tx.hash, FAUCET_AMOUNT);

      return {
        success: true,
        txHash: tx.hash,
      };
    }

    console.log(`Transaction confirmed: ${tx.hash}`);

    // Set cooldown and add to transaction history
    await setCooldown(address);
    await addTransaction(address, tx.hash, FAUCET_AMOUNT);

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (error) {
    console.error("Error sending ETH:", error);

    // Provide more specific error messages based on the error
    let errorMessage = "Failed to send ETH. Please try again later.";

    if (error instanceof Error) {
      if (error.message.includes("insufficient funds")) {
        errorMessage =
          "The faucet wallet has insufficient funds. Please contact the administrator.";
      } else if (error.message.includes("nonce")) {
        errorMessage = "Transaction nonce error. Please try again.";
      } else if (error.message.includes("gas")) {
        errorMessage =
          "Gas estimation failed. The network might be congested. Please try again later.";
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Function to get recent transactions
export async function getRecentTransactions(): Promise<Transaction[]> {
  return transactionHistory;
}
