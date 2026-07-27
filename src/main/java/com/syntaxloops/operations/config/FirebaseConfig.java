package com.syntaxloops.operations.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder();

            InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("serviceAccountKey.json");

            if (serviceAccount != null) {
                // 1. Local Development Path (uses serviceAccountKey.json)
                optionsBuilder.setCredentials(GoogleCredentials.fromStream(serviceAccount));
                System.out.println("Firebase initialized with local serviceAccountKey.json");
            } else {
                // 2. Cloud Run Production Path (uses Application Default Credentials)
                optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
                optionsBuilder.setProjectId("syntaxloops-f1d72"); // Your Firebase Project ID
                System.out.println("Firebase initialized with Cloud Application Default Credentials");
            }

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(optionsBuilder.build());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Bean
    public Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }
}