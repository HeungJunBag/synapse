package com.synapse.backend.domain.note.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "note_links",
        uniqueConstraints = @UniqueConstraint(columnNames = {"source_note_id", "target_note_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NoteLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_note_id", nullable = false)
    private Note sourceNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_note_id", nullable = false)
    private Note targetNote;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public static NoteLink of(Note sourceNote, Note targetNote) {
        NoteLink link = new NoteLink();
        link.sourceNote = sourceNote;
        link.targetNote = targetNote;
        return link;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
