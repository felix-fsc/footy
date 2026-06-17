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

        List<DemoMatch> demoMatches = List.of(
                new DemoMatch("Partido demo Footy", "Campo Municipal Norte", "Calle Futbol 12", "Madrid", "40.416775", "-3.703790", 1, 19, 5),
                new DemoMatch("Futbol 7 tarde", "Polideportivo Chamberi", "Calle Santander 7", "Madrid", "40.436210", "-3.703120", 2, 20, 7),
                new DemoMatch("Pachanga centro", "Campo Retiro Sur", "Avenida Menendez Pelayo 41", "Madrid", "40.411450", "-3.681250", 3, 18, 5),
                new DemoMatch("Liga amistosa norte", "La Chopera Futbol", "Paseo de la Chopera 6", "Madrid", "40.393410", "-3.699630", 4, 21, 6),
                new DemoMatch("Partido de felix", "Campo Saladillo", "Calle Hermanos Alvarez Quintero 13", "Huelva", "37.261420", "-6.944720", 2, 17, 5),
                new DemoMatch("Domingo futbolero", "Ciudad Deportiva Huelva", "Avenida Decano del Futbol", "Huelva", "37.255830", "-6.950150", 5, 11, 7));

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
