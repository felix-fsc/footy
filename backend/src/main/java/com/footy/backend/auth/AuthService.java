package com.footy.backend.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import com.footy.backend.domain.user.User;
import com.footy.backend.domain.user.UserRepository;

@Service
public class AuthService {

    private static final String TOKEN_TYPE = "Bearer";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final RestClient googleTokenInfoClient;
    private final Set<String> googleClientIds;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            RestClient.Builder restClientBuilder,
            @Value("${app.security.google.client-ids:}") String googleClientIds) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.googleTokenInfoClient = restClientBuilder.baseUrl("https://oauth2.googleapis.com").build();
        this.googleClientIds = Arrays.stream(googleClientIds.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toUnmodifiableSet());
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        String displayName = request.displayName().trim();
        User user = new User(
                email,
                passwordEncoder.encode(request.password()),
                displayName,
                createUniqueUsername(displayName));
        User savedUser = userRepository.save(user);

        return createAuthResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return createAuthResponse(ensureUsername(user));
    }

    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        if (googleClientIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google login is not configured");
        }

        Map<?, ?> tokenInfo;
        try {
            tokenInfo = googleTokenInfoClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/tokeninfo")
                            .queryParam("id_token", request.idToken())
                            .build())
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException error) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }

        if (tokenInfo == null || !googleClientIds.contains(asString(tokenInfo.get("aud")))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google audience");
        }
        if (!"true".equalsIgnoreCase(asString(tokenInfo.get("email_verified")))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
        }

        String email = normalizeEmail(asString(tokenInfo.get("email")));
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email is missing");
        }

        String googleDisplayName = asString(tokenInfo.get("name"));
        if (googleDisplayName.isBlank()) {
            int atIndex = email.indexOf("@");
            googleDisplayName = atIndex > 0 ? email.substring(0, atIndex) : email;
        }
        String displayName = googleDisplayName.trim();
        String googleSubject = asString(tokenInfo.get("sub"));
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(new User(
                        email,
                        passwordEncoder.encode("GOOGLE:" + googleSubject),
                        displayName,
                        createUniqueUsername(displayName))));

        return createAuthResponse(ensureUsername(user));
    }

    private AuthResponse createAuthResponse(User user) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(365, ChronoUnit.DAYS);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("footy-backend")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("displayName", user.getDisplayName())
                .claim("username", user.getUsername())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(
                token,
                TOKEN_TYPE,
                expiresAt,
                new AuthUserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getUsername()));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String asString(Object value) {
        return value == null ? "" : value.toString();
    }

    private User ensureUsername(User user) {
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user;
        }
        user.setUsername(createUniqueUsername(user.getDisplayName()));
        return userRepository.save(user);
    }

    private String createUniqueUsername(String source) {
        String base = normalizeUsername(source);
        String candidate = base;
        int suffix = 2;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            String suffixText = String.valueOf(suffix);
            int maxBaseLength = Math.max(1, 30 - suffixText.length());
            candidate = base.substring(0, Math.min(base.length(), maxBaseLength)) + suffixText;
            suffix++;
        }
        return candidate;
    }

    private String normalizeUsername(String source) {
        String normalized = source == null ? "" : source.toLowerCase()
                .replaceAll("[^a-z0-9_]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
        if (normalized.length() < 3) {
            normalized = "jugador";
        }
        if (normalized.length() > 30) {
            normalized = normalized.substring(0, 30);
        }
        return normalized;
    }
}
