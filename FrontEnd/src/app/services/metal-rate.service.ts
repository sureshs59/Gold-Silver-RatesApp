import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MetalRate {
  metal: string;
  todayRate: number;
  yesterdayRate: number;
  unit: string;
  change: number;
  changePercent: number;
}

export interface RateHistory {
  date: string;
  price: number;
}

export interface PredictionResponse {
  metal: string;
  latestPrice: number;
  predictedPrice: number;
  trend: string;
  changePercent: number;
  confidence: number;
  model: string;
  featuresUsed?: string[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetalRateService {

  private baseUrl = 'http://localhost:8080/api/rates';

  constructor(private http: HttpClient) {}

  getTodayRates(): Observable<MetalRate[]> {
    return this.http.get<MetalRate[]>(`${this.baseUrl}/today`);
  }

  getGoldHistory(): Observable<RateHistory[]> {
    return this.http.get<RateHistory[]>(`${this.baseUrl}/history/gold`);
  }

  getSilverHistory(): Observable<RateHistory[]> {
    return this.http.get<RateHistory[]>(`${this.baseUrl}/history/silver`);
  }

  getGoldPrediction(): Observable<PredictionResponse> {
  return this.http.get<PredictionResponse>(`${this.baseUrl}/prediction/Gold`);
}

  getSilverPrediction(): Observable<PredictionResponse> {
    return this.http.get<PredictionResponse>(`${this.baseUrl}/prediction/Silver`);
  }
}