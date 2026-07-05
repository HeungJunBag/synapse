package com.synapse.backend.domain.note.dto;

import java.util.List;
import java.util.UUID;

public record GraphResponse(
        List<Node> nodes,
        List<Edge> edges
) {
    public record Node(UUID id, String title) {}
    public record Edge(UUID source, UUID target) {}
}
