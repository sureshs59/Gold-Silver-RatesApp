import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import {
  MetalRate,
  MetalRateService,
  PredictionResponse,
  RateHistory
} from '../services/metal-rate.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  rates: MetalRate[] = [];
  goldHistory: RateHistory[] = [];
  silverHistory: RateHistory[] = [];

  goldPrediction?: PredictionResponse;
  silverPrediction?: PredictionResponse;

  loading = false;
  errorMessage = '';

  goldChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Gold Price',
        tension: 0.4,
        fill: false
      }
    ]
  };

  silverChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Silver Price',
        tension: 0.4,
        fill: false
      }
    ]
  };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  constructor(private metalRateService: MetalRateService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      todayRates: this.metalRateService.getTodayRates().pipe(catchError(() => of([]))),
      goldHistory: this.metalRateService.getGoldHistory().pipe(catchError(() => of([]))),
      silverHistory: this.metalRateService.getSilverHistory().pipe(catchError(() => of([]))),
      goldPrediction: this.metalRateService.getGoldPrediction().pipe(catchError(() => of(null))),
      silverPrediction: this.metalRateService.getSilverPrediction().pipe(catchError(() => of(null)))
    }).subscribe(result => {
      this.rates = result.todayRates;
      this.goldHistory = result.goldHistory;
      this.silverHistory = result.silverHistory;
      this.goldPrediction = result.goldPrediction ?? undefined;
      this.silverPrediction = result.silverPrediction ?? undefined;
    });
  }

  prepareGoldChart(): void {
    this.goldChartData = {
      labels: this.goldHistory.map(item => item.date),
      datasets: [
        {
          data: this.goldHistory.map(item => item.price),
          label: 'Gold Price',
          tension: 0.4,
          fill: false
        }
      ]
    };
  }

  prepareSilverChart(): void {
    this.silverChartData = {
      labels: this.silverHistory.map(item => item.date),
      datasets: [
        {
          data: this.silverHistory.map(item => item.price),
          label: 'Silver Price',
          tension: 0.4,
          fill: false
        }
      ]
    };
  }

  
}