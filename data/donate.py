"""
REHNOVA tip wallets (BTC + ETH only). Paste your addresses below.
Empty string hides that coin until you set it.
"""

DONATE_CONTACT = "rehnova@proton.me"

# Paste real receiving addresses (public). Wrong address = lost funds.
BTC_ADDRESS = "gdgdgsdgdgd09090"  # e.g. bc1q...
ETH_ADDRESS = "usafjksjfjdfjsdfj"  # e.g. 0x...


def donate_context():
    wallets = []
    if (BTC_ADDRESS or "").strip():
        wallets.append({
            "symbol": "BTC",
            "name": "Bitcoin",
            "address": BTC_ADDRESS.strip(),
        })
    if (ETH_ADDRESS or "").strip():
        wallets.append({
            "symbol": "ETH",
            "name": "Ethereum",
            "address": ETH_ADDRESS.strip(),
        })
    return {
        "donate_contact": DONATE_CONTACT,
        "wallets": wallets,
        "wallets_configured": len(wallets) > 0,
    }
