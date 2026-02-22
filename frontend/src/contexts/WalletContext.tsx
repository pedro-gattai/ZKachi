import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "@/lib/soroban";

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  network: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-reconnect on mount if Freighter is installed and already authorized
  useEffect(() => {
    (async () => {
      try {
        const { isConnected } = await freighterIsConnected();
        if (!isConnected) return;

        const { isAllowed } = await freighterIsAllowed();
        if (!isAllowed) return;

        const addrResult = await getAddress();
        if (addrResult.error) return;

        const netResult = await getNetwork();
        if (netResult.error) return;

        if (netResult.network !== "TESTNET") {
          setError("Please switch Freighter to Testnet");
          return;
        }

        setPublicKey(addrResult.address);
        setNetwork(netResult.network);
        setConnected(true);
      } catch {
        // Freighter not installed or unavailable — silently ignore
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);

    try {
      const { isConnected } = await freighterIsConnected();
      if (!isConnected) {
        setError("Please install the Freighter wallet extension");
        setConnecting(false);
        return;
      }

      const accessResult = await requestAccess();
      if (accessResult.error) {
        setError(accessResult.error);
        setConnecting(false);
        return;
      }

      const netResult = await getNetwork();
      if (netResult.error) {
        setError(netResult.error);
        setConnecting(false);
        return;
      }

      if (netResult.network !== "TESTNET") {
        setError("Please switch Freighter to Testnet");
        setConnecting(false);
        return;
      }

      setPublicKey(accessResult.address);
      setNetwork(netResult.network);
      setConnected(true);
    } catch {
      setError("Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setPublicKey(null);
    setNetwork(null);
    setError(null);
  }, []);

  const walletSignTransaction = useCallback(async (xdr: string): Promise<string> => {
    const result = await freighterSignTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return result.signedTxXdr;
  }, []);

  return (
    <WalletContext.Provider value={{ connected, publicKey, network, connecting, error, connect, disconnect, signTransaction: walletSignTransaction }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
