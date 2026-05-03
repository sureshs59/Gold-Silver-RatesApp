from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

app = FastAPI(title="Gold Silver ML Prediction API")


class RateRecord(BaseModel):
    date: str
    price: float


class PredictionRequest(BaseModel):
    metal: str
    history: List[RateRecord]


@app.get("/")
def home():
    return {"message": "ML Prediction API is running"}


def create_features(df):
    df = df.copy()

    df["price_change"] = df["price"].diff()
    df["percent_change"] = df["price"].pct_change() * 100
    df["ma_3"] = df["price"].rolling(window=3).mean()
    df["ma_5"] = df["price"].rolling(window=5).mean()
    df["volatility_3"] = df["price"].rolling(window=3).std()

    return df.dropna()


@app.post("/predict")
def predict_price(request: PredictionRequest):

    if len(request.history) < 8:
        return {
            "metal": request.metal,
            "error": "Not enough historical data. Minimum 8 records required."
        }

    df = pd.DataFrame([item.dict() for item in request.history])
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    feature_df = create_features(df)

    features = [
        "price",
        "price_change",
        "percent_change",
        "ma_3",
        "ma_5",
        "volatility_3"
    ]

    feature_df["target"] = feature_df["price"].shift(-1)
    feature_df = feature_df.dropna()

    X = feature_df[features]
    y = feature_df["target"]

    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42
    )

    model.fit(X, y)

    latest_feature_df = create_features(df)
    latest_row = latest_feature_df.iloc[-1]

    latest_features = pd.DataFrame([{
        "price": latest_row["price"],
        "price_change": latest_row["price_change"],
        "percent_change": latest_row["percent_change"],
        "ma_3": latest_row["ma_3"],
        "ma_5": latest_row["ma_5"],
        "volatility_3": latest_row["volatility_3"]
    }])

    predicted_price = model.predict(latest_features)[0]
    latest_price = latest_row["price"]

    change_percent = ((predicted_price - latest_price) / latest_price) * 100

    if change_percent > 0.3:
        trend = "UP"
    elif change_percent < -0.3:
        trend = "DOWN"
    else:
        trend = "STABLE"

    confidence = min(95, max(60, 70 + abs(change_percent) * 8))

    return {
        "metal": request.metal,
        "latestPrice": round(float(latest_price), 2),
        "predictedPrice": round(float(predicted_price), 2),
        "trend": trend,
        "changePercent": round(float(change_percent), 2),
        "confidence": round(float(confidence), 2),
        "model": "RandomForestRegressor",
        "featuresUsed": features
    }