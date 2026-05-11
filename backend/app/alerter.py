import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def send_alert(to_email: str, product_name: str, current_price: float, threshold: float, url: str):
    sender = os.getenv("ALERT_EMAIL")
    password = os.getenv("ALERT_PASSWORD")

    if not sender or not password:
        print("Email credentials not configured")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Price Drop Alert: {product_name} is now Rs.{current_price}"
    msg["From"] = sender
    msg["To"] = to_email

    html = f"""
    <html><body style="font-family:Arial;padding:20px;background:#f5f5f5">
      <div style="background:white;padding:24px;border-radius:8px;max-width:500px;margin:auto">
        <h2 style="color:#1A5276">Price Drop Alert!</h2>
        <p><strong>{product_name}</strong> has dropped below your threshold.</p>
        <table style="width:100%;margin:16px 0">
          <tr><td>Current Price</td><td><strong style="color:green">Rs. {current_price}</strong></td></tr>
          <tr><td>Your Threshold</td><td>Rs. {threshold}</td></tr>
        </table>
        <a href="{url}" style="background:#1A5276;color:white;padding:10px 20px;
           text-decoration:none;border-radius:4px">View Product</a>
      </div>
    </body></html>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.sendmail(sender, to_email, msg.as_string())
        print(f"Alert sent to {to_email}")
    except Exception as e:
        print(f"Email error: {e}")