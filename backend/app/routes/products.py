from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db, Product, PriceHistory
from app.scraper import scrape_price
from app.alerter import send_alert

router = APIRouter(prefix="/products", tags=["products"])

class ProductCreate(BaseModel):
    name: str
    url: str
    alert_threshold: float
    user_email: str

@router.get("/")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.post("/")
def add_product(data: ProductCreate, db: Session = Depends(get_db)):
    price = scrape_price(data.url)
    product = Product(
        name=data.name,
        url=data.url,
        alert_threshold=data.alert_threshold,
        user_email=data.user_email,
        current_price=price
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    if price:
        db.add(PriceHistory(product_id=product.id, price=price))
        db.commit()
    return product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(product)
    db.commit()
    return {"message": "Deleted"}

@router.get("/{product_id}/history")
def get_history(product_id: int, db: Session = Depends(get_db)):
    return db.query(PriceHistory).filter(
        PriceHistory.product_id == product_id
    ).all()

@router.post("/check-all")
def check_all_prices(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    results = []
    for p in products:
        new_price = scrape_price(p.url)
        if new_price:
            db.add(PriceHistory(product_id=p.id, price=new_price))
            if p.current_price and new_price <= p.alert_threshold and p.current_price > p.alert_threshold:
                send_alert(p.user_email, p.name, new_price, p.alert_threshold, p.url)
            p.current_price = new_price
            db.commit()
            results.append({"id": p.id, "name": p.name, "price": new_price})
    return results
