package com.synapse.backend.domain.note.dto;

import com.synapse.backend.domain.note.entity.Note;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record NoteResponse(
        UUID id,
        String title,
        String content,
        List<String> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static NoteResponse from(Note note) {
        List<String> tagNames = note.getNoteTags().stream()
                .map(nt -> nt.getTag().getName())
                .toList();

        return new NoteResponse(
                note.getId(),
                note.getTitle(),
                note.getContent(),
                tagNames,
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
