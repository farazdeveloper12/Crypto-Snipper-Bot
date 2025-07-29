export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = (blockchain) => {
    setIsConnected(true);
    // State managed by Phantom's own connection now
  };

  const disconnect = () => {
    window.solana?.disconnect();
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider value={{
      wallet: window.solana?.publicKey?.toString(),
      isConnected,
      connect,
      disconnect
    }}>
      {children}
    </WalletContext.Provider>
  );
};