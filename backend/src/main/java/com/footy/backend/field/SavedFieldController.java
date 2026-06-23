package com.footy.backend.field;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.footy.backend.match.FieldResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/fields")
public class SavedFieldController {

    private final SavedFieldService savedFieldService;

    public SavedFieldController(SavedFieldService savedFieldService) {
        this.savedFieldService = savedFieldService;
    }

    @GetMapping
    List<FieldResponse> listSavedFields() {
        return savedFieldService.listSavedFields();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    FieldResponse createSavedField(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SavedFieldRequest request) {
        return savedFieldService.createSavedField(UUID.fromString(jwt.getSubject()), request);
    }

    @PutMapping("/{id}")
    FieldResponse updateSavedField(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody SavedFieldRequest request) {
        return savedFieldService.updateSavedField(UUID.fromString(jwt.getSubject()), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteSavedField(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        savedFieldService.deleteSavedField(UUID.fromString(jwt.getSubject()), id);
    }
}
