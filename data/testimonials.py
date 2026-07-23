"""
Passfill reviews context — loaded from Google Sheets (securiti pattern).
"""
from data.sheets import fetch_reviews, sheets_configured


def testimonials_context():
    reviews = []
    try:
        reviews = fetch_reviews(include_pending=False)
    except Exception as e:
        print(f"testimonials_context: {e}")
        reviews = []

    return {
        "pf_reviews": reviews,
        "pf_review_count": len(reviews),
        "pf_sheets_ok": sheets_configured(),
        "review_email": "rehnova@proton.me",
    }
