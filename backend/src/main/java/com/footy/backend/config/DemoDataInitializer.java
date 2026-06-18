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
                        "Demo Footy")));

        matchRepository.findAll().stream()
                .filter(match -> match.getField() != null)
                .filter(match -> match.getField().getCity() == null
                        || !"Huelva".equalsIgnoreCase(match.getField().getCity()))
                .forEach(Match::cancel);

        List<DemoMatch> demoMatches = List.of(
                new DemoMatch("Footy Huelva - Nuevo Colombino", "Estadio Nuevo Colombino", "Avenida del Decano del Futbol Espanol s/n", "Huelva", "37.257910", "-6.950640", 1, 19, 5),
                new DemoMatch("Footy Huelva - Perez Cubillas", "Campo Municipal Perez Cubillas", "Barriada Perez Cubillas", "Huelva", "37.278330", "-6.929580", 2, 20, 7),
                new DemoMatch("Footy Huelva - Ciudad Deportiva", "Ciudad Deportiva Decano del Futbol Espanol", "Poligono Agroalimentario", "Huelva", "37.255830", "-6.950150", 3, 18, 5),
                new DemoMatch("Footy Huelva - Los Rosales", "Campo Municipal Los Rosales", "Barriada Los Rosales", "Huelva", "37.270550", "-6.931760", 4, 21, 6),
                new DemoMatch("Footy Huelva - Diego Lobato", "Polideportivo Municipal Diego Lobato", "Calle Artesanos", "Huelva", "37.273950", "-6.936850", 2, 17, 5),
                new DemoMatch("Footy Huelva - Saladillo", "Campo Municipal Saladillo", "Calle Hermanos Alvarez Quintero 13", "Huelva", "37.261420", "-6.944720", 5, 11, 7));

        for (DemoMatch demoMatch : demoMatches) {
            if (matchRepository.existsByTitle(demoMatch.title())) {
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
            matchRepository.save(new Match(demoMatch.title(), field, startsAt, demoMatch.maxPlayersPerTeam(), organizer));
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
            int maxPlayersPerTeam) {
    }
}
