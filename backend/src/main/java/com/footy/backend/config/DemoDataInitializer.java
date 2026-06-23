package com.footy.backend.config;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.footy.backend.domain.field.Field;
import com.footy.backend.domain.field.FieldRepository;
import com.footy.backend.domain.match.Match;
import com.footy.backend.domain.match.MatchRepository;
import com.footy.backend.domain.user.User;
import com.footy.backend.domain.user.UserRepository;

@Component
@Profile("!test")
public class DemoDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final FieldRepository fieldRepository;
    private final MatchRepository matchRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(
            UserRepository userRepository,
            FieldRepository fieldRepository,
            MatchRepository matchRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.fieldRepository = fieldRepository;
        this.matchRepository = matchRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User organizer = userRepository.findByEmail("demo@footy.local")
                .orElseGet(() -> userRepository.save(new User(
                        "demo@footy.local",
                        passwordEncoder.encode("Password123"),
                        "Demo Footy",
                        "demo_footy")));
        if (organizer.getUsername() == null || organizer.getUsername().isBlank()) {
            organizer.setUsername("demo_footy");
        }
        backfillUsernames();

        matchRepository.findAll().stream()
                .filter(match -> match.getField() != null)
                .filter(match -> match.getField().getCity() == null
                        || !"Huelva".equalsIgnoreCase(match.getField().getCity()))
                .forEach(Match::cancel);

        List<DemoMatch> demoMatches = List.of(
                new DemoMatch("Footy Huelva - Nuevo Colombino", "Estadio Nuevo Colombino", "Avenida del Decano del Futbol Espanol s/n", "Huelva", "37.257910", "-6.950640", 1, 19, 5, 350, "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1000&q=72"),
                new DemoMatch("Footy Huelva - Perez Cubillas", "Campo Municipal Perez Cubillas", "Barriada Perez Cubillas", "Huelva", "37.278330", "-6.929580", 2, 20, 7, 425, "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=72"),
                new DemoMatch("Footy Huelva - Ciudad Deportiva", "Ciudad Deportiva Decano del Futbol Espanol", "Poligono Agroalimentario", "Huelva", "37.255830", "-6.950150", 3, 18, 5, 300, "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1000&q=72"),
                new DemoMatch("Footy Huelva - Los Rosales", "Campo Municipal Los Rosales", "Barriada Los Rosales", "Huelva", "37.270550", "-6.931760", 4, 21, 6, 375, "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1000&q=72"),
                new DemoMatch("Footy Huelva - Diego Lobato", "Polideportivo Municipal Diego Lobato", "Calle Artesanos", "Huelva", "37.273950", "-6.936850", 2, 17, 5, 325, "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=72"),
                new DemoMatch("Footy Huelva - Saladillo", "Campo Municipal Saladillo", "Calle Hermanos Alvarez Quintero 13", "Huelva", "37.261420", "-6.944720", 5, 11, 7, 450, "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=72"));

        for (DemoMatch demoMatch : demoMatches) {
            Match existingMatch = matchRepository.findByTitle(demoMatch.title()).orElse(null);
            if (existingMatch != null) {
                existingMatch.setPricePerPersonCents(demoMatch.pricePerPersonCents());
                existingMatch.setCoverImageUrl(demoMatch.coverImageUrl());
                continue;
            }

            Field field = fieldRepository.save(new Field(
                    demoMatch.fieldName(),
                    demoMatch.address(),
                    demoMatch.city(),
                    new BigDecimal(demoMatch.latitude()),
                    new BigDecimal(demoMatch.longitude())));
            Instant startsAt = Instant.now()
                    .plus(demoMatch.daysFromNow(), ChronoUnit.DAYS)
                    .truncatedTo(ChronoUnit.DAYS)
                    .plus(demoMatch.hour(), ChronoUnit.HOURS);
            matchRepository.save(new Match(
                    demoMatch.title(),
                    field,
                    startsAt,
                    demoMatch.maxPlayersPerTeam(),
                    demoMatch.pricePerPersonCents(),
                    demoMatch.coverImageUrl(),
                    organizer));
        }
    }

    private record DemoMatch(
            String title,
            String fieldName,
            String address,
            String city,
            String latitude,
            String longitude,
            long daysFromNow,
            int hour,
            int maxPlayersPerTeam,
            int pricePerPersonCents,
            String coverImageUrl) {
    }

    private void backfillUsernames() {
        userRepository.findAll().forEach(user -> {
            if (user.getUsername() != null && !user.getUsername().isBlank()) {
                return;
            }
            user.setUsername(createUniqueUsername(user.getDisplayName(), user.getId().toString().substring(0, 6)));
        });
    }

    private String createUniqueUsername(String displayName, String fallbackSuffix) {
        String base = normalizeUsername(displayName);
        String candidate = base;
        int suffix = 2;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            String suffixText = String.valueOf(suffix);
            int maxBaseLength = Math.max(1, 30 - suffixText.length());
            candidate = base.substring(0, Math.min(base.length(), maxBaseLength)) + suffixText;
            suffix++;
        }
        if (!candidate.isBlank()) {
            return candidate;
        }
        return ("jugador_" + fallbackSuffix).substring(0, 14);
    }

    private String normalizeUsername(String value) {
        String normalized = value == null ? "" : value.toLowerCase()
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
