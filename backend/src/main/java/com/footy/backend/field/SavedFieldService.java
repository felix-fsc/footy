package com.footy.backend.field;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.footy.backend.domain.field.Field;
import com.footy.backend.domain.field.FieldRepository;
import com.footy.backend.domain.user.User;
import com.footy.backend.domain.user.UserRepository;
import com.footy.backend.domain.user.UserRole;
import com.footy.backend.match.FieldResponse;

@Service
public class SavedFieldService {

    private final FieldRepository fieldRepository;
    private final UserRepository userRepository;

    public SavedFieldService(FieldRepository fieldRepository, UserRepository userRepository) {
        this.fieldRepository = fieldRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<FieldResponse> listSavedFields() {
        return fieldRepository.findAllBySavedFieldTrueOrderByCityAscNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FieldResponse createSavedField(UUID currentUserId, SavedFieldRequest request) {
        ensureAdmin(currentUserId);
        Field field = new Field(
                request.name().trim(),
                blankToNull(request.address()),
                blankToNull(request.city()),
                request.latitude(),
                request.longitude());
        field.markSaved();
        return toResponse(fieldRepository.save(field));
    }

    @Transactional
    public FieldResponse updateSavedField(UUID currentUserId, UUID fieldId, SavedFieldRequest request) {
        ensureAdmin(currentUserId);
        Field field = getSavedField(fieldId);
        field.update(
                request.name().trim(),
                blankToNull(request.address()),
                blankToNull(request.city()),
                request.latitude(),
                request.longitude());
        return toResponse(field);
    }

    @Transactional
    public void deleteSavedField(UUID currentUserId, UUID fieldId) {
        ensureAdmin(currentUserId);
        Field field = getSavedField(fieldId);
        field.unmarkSaved();
    }

    private Field getSavedField(UUID fieldId) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Field not found"));
        if (!field.isSavedField()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Field not found");
        }
        return field;
    }

    private void ensureAdmin(UUID currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        if (user.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
        }
    }

    private FieldResponse toResponse(Field field) {
        return new FieldResponse(
                field.getId(),
                field.getName(),
                field.getAddress(),
                field.getCity(),
                field.getLatitude(),
                field.getLongitude());
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
