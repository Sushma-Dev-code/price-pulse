import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def scrape_price(url: str):
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        selectors = [
            {"class": "a-price-whole"},
            {"class": "pdp-price"},
            {"itemprop": "price"},
        ]
        for sel in selectors:
            tag = soup.find(attrs=sel)
            if tag:
                raw = tag.get_text().strip().replace(",", "").replace("₹", "").replace("$", "")
                digits = "".join(c for c in raw if c.isdigit() or c == ".")
                if digits:
                    return float(digits)
        return None
    except Exception as e:
        print(f"Scrape error: {e}")
        return None