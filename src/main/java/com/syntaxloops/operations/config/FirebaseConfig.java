package com.syntaxloops.operations.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder();
            InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("serviceAccountKey.json");
            String base64Key = System.getenv("GCP_SA_KEY_BASE64");

            if (serviceAccount != null) {
                // 1. Local Development Path (uses local serviceAccountKey.json)
                optionsBuilder.setCredentials(GoogleCredentials.fromStream(serviceAccount));
                System.out.println("Firebase initialized with local serviceAccountKey.json");
            } else if (base64Key != null && !base64Key.trim().isEmpty()) {
                // 2. Azure Production Path (uses Base64 Env Var)
                byte[] decodedKey = Base64.getDecoder().decode(base64Key.trim());
                ByteArrayInputStream stream = new ByteArrayInputStream(decodedKey);
                optionsBuilder.setCredentials(GoogleCredentials.fromStream(stream));
                System.out.println("Firebase initialized via GCP_SA_KEY_BASE64 environment variable");
            } else {
                // 3. Fallback for GCP Cloud Run (Application Default Credentials)
                optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
                optionsBuilder.setProjectId("syntaxloops-f1d72");
                System.out.println("Firebase initialized with Cloud Application Default Credentials");
            }

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(optionsBuilder.build());
            }
        } catch (Exception e) {
            System.err.println("Failed to initialize Firebase: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Bean
    public Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }
}