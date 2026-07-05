package com.synapse.backend.domain.note.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record NoteRequest(
        @NotBlank String title,
        String content,
        List<String> tags
) {}
