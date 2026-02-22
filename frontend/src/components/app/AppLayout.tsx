import { useEffect } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

const AppLayout = () => {
  const { connected, publicKey, connecting, error, connect, disconnect } = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({ title: "Wallet Error", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-zkachi/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="font-bold text-lg shrink-0">
            <span className="text-foreground">ZK</span>
            <span className="text-secondary">achi</span>
          </Link>

          {/* Center: Tabs */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/app/game"
              className={({ isActive }) =>
                `font-space text-[9px] tracking-[1.5px] uppercase px-5 py-2 border-b-2 transition-colors ${
                  isActive
                    ? "text-zkachi-gold border-zkachi-gold"
                    : "text-zkachi-text-tertiary border-transparent hover:text-zkachi-text-secondary"
                }`
              }
            >
              Game
            </NavLink>
            <NavLink
              to="/app/pool"
              className={({ isActive }) =>
                `font-space text-[9px] tracking-[1.5px] uppercase px-5 py-2 border-b-2 transition-colors ${
                  isActive
                    ? "text-zkachi-gold border-zkachi-gold"
                    : "text-zkachi-text-tertiary border-transparent hover:text-zkachi-text-secondary"
                }`
              }
            >
              Pool
            </NavLink>
            <NavLink
              to="/app/verify"
              className={({ isActive }) =>
                `font-space text-[9px] tracking-[1.5px] uppercase px-5 py-2 border-b-2 transition-colors ${
                  isActive
                    ? "text-zkachi-gold border-zkachi-gold"
                    : "text-zkachi-text-tertiary border-transparent hover:text-zkachi-text-secondary"
                }`
              }
            >
              Verify
            </NavLink>
            <NavLink
              to="/app/docs"
              className={({ isActive }) =>
                `font-space text-[9px] tracking-[1.5px] uppercase px-5 py-2 border-b-2 transition-colors ${
                  isActive
                    ? "text-zkachi-gold border-zkachi-gold"
                    : "text-zkachi-text-tertiary border-transparent hover:text-zkachi-text-secondary"
                }`
              }
            >
              Docs
            </NavLink>
          </div>

          {/* Right: Connect Wallet */}
          {!connected ? (
            <button
              onClick={connect}
              disabled={connecting}
              className="font-space text-[9px] tracking-[1.5px] uppercase bg-zkachi-gold/10 text-zkachi-gold border border-zkachi-gold/20 px-4 py-2 rounded-lg hover:bg-zkachi-gold/15 transition-colors disabled:opacity-50"
            >
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="font-space text-[9px] tracking-[1.5px] uppercase bg-zkachi-green/10 text-zkachi-green border border-zkachi-green/20 px-4 py-2 rounded-lg hover:bg-zkachi-green/15 transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zkachi-green" />
                  {truncateAddress(publicKey!)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(publicKey!);
                    toast({ title: "Address copied" });
                  }}
                >
                  <span className="font-space text-[10px]">Copy Address</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnect}>
                  <span className="font-space text-[10px] text-destructive">Disconnect</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 pt-20 pb-12 px-6">
        <div className="max-w-[1080px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
