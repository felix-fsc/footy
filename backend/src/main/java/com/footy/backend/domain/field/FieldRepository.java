package com.footy.backend.domain.field;

import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FieldRepository extends JpaRepository<Field, UUID> {

    List<Field> findAllBySavedFieldTrueOrderByCityAscNameAsc();
}
