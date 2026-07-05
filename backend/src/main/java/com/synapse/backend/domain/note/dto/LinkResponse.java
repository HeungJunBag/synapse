package com.synapse.backend.domain.note.dto;

import java.util.List;
import java.util.UUID;

public record LinkResponse(
        List<NoteRef> outgoing,
        List<NoteRef> backlinks
) {
    public record NoteRef(UUID id, String title) {}
}
