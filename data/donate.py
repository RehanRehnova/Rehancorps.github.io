"""
REHNOVA tip wallets. Paste your addresses below.
Empty string hides that coin until you set it.
Order on page: USDT → ETH → BTC.
"""

DONATE_CONTACT = "rehnova@proton.me"

# Paste real receiving addresses (public). Wrong network/address = lost funds.
USDT_ADDRESS = "fsdfsdg"  # TRC20 / ERC20 / etc. — set network label below
USDT_NETWORK = "TRC20 (Tron)"  # change if you use ERC20, BEP20, etc.

ETH_ADDRESS = "sdgdgds"  # 0x...
ETH_NETWORK = "Ethereum mainnet"

BTC_ADDRESS = "dgsdgsg"  # bc1... / 1... / 3...
BTC_NETWORK = "Bitcoin (on-chain)"


def donate_context():
    wallets = []
    if (USDT_ADDRESS or "").strip():
        wallets.append({
            "symbol": "USDT",
            "name": "Tether",
            "network": USDT_NETWORK,
            "address": USDT_ADDRESS.strip(),
        })
    if (ETH_ADDRESS or "").strip():
        wallets.append({
            "symbol": "ETH",
            "name": "Ethereum",
            "network": ETH_NETWORK,
            "address": ETH_ADDRESS.strip(),
        })
    if (BTC_ADDRESS or "").strip():
        wallets.append({
            "symbol": "BTC",
            "name": "Bitcoin",
            "network": BTC_NETWORK,
            "address": BTC_ADDRESS.strip(),
        })
    return {
        "donate_contact": DONATE_CONTACT,
        "wallets": wallets,
        "wallets_configured": len(wallets) > 0,
    }
