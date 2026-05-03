package com.example.goldsilverapp.service;

import com.example.goldsilverapp.config.MetalApiProperties;
import com.example.goldsilverapp.dto.ExternalRateResponse;
import com.example.goldsilverapp.dto.MetalApiResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

@Service
public class ExternalRateService {

    private final WebClient webClient;
    private final MetalApiProperties properties;

    public ExternalRateService(WebClient.Builder builder, MetalApiProperties properties) {
        this.properties = properties;
        this.webClient = builder
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    @Retry(name = "metalApi", fallbackMethod = "fallbackRates")
    @CircuitBreaker(name = "metalApi", fallbackMethod = "fallbackRates")
    public List<ExternalRateResponse> fetchTodayRates() {

        MetalApiResponse response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/latest")
                        .queryParam("api_key", properties.getKey())
                        .queryParam("base", "INR")
                        .queryParam("currencies", "XAU,XAG")
                        .build())
                .retrieve()
                .bodyToMono(MetalApiResponse.class)
                .timeout(Duration.ofSeconds(5))
                .block();

        if (response == null || response.getRates() == null) {
            throw new RuntimeException("External API response is empty");
        }

        Double goldRate = response.getRates().get("INRXAU");
        Double silverRate = response.getRates().get("INRXAG");

        return List.of(
                new ExternalRateResponse("Gold", goldPer10Gram(goldRate), "10 gram"),
                new ExternalRateResponse("Silver", silverPerKg(silverRate), "1 kg")
        );
    }

    private List<ExternalRateResponse> fallbackRates(Throwable ex) {
        System.err.println("External metal API failed. Fallback triggered: " + ex.getMessage());

        return List.of(
                new ExternalRateResponse("Gold", 72500, "10 gram"),
                new ExternalRateResponse("Silver", 83500, "1 kg")
        );
    }

    private double goldPer10Gram(Double inrPerTroyOunce) {
        if (inrPerTroyOunce == null) {
            throw new RuntimeException("Gold rate missing from API response");
        }
        return Math.round((inrPerTroyOunce / 31.1035 * 10) * 100.0) / 100.0;
    }

    private double silverPerKg(Double inrPerTroyOunce) {
        if (inrPerTroyOunce == null) {
            throw new RuntimeException("Silver rate missing from API response");
        }
        return Math.round((inrPerTroyOunce / 31.1035 * 1000) * 100.0) / 100.0;
    }
}