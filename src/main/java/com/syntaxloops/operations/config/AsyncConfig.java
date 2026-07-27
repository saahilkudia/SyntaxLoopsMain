package com.syntaxloops.operations.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    // This is the dedicated background engine for Shopify Webhooks.
    // It prevents your main application from crashing under heavy e-commerce load.
    @Bean(name = "webhookTaskExecutor")
    public Executor webhookTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);  // Base number of parallel threads
        executor.setMaxPoolSize(100);  // Scale up to 100 parallel threads during massive flash sales
        executor.setQueueCapacity(500); // If more than 100 hit at once, queue the next 500 safely
        executor.setThreadNamePrefix("ShopifyWebhookWorker-");
        executor.initialize();
        return executor;
    }
}