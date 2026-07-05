package com.synapse.backend.domain.note.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "note_tags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NoteTag {

    @EmbeddedId
    private NoteTagId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("noteId")
    @JoinColumn(name = "note_id")
    private Note note;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tagId")
    @JoinColumn(name = "tag_id")
    private Tag tag;

    public static NoteTag of(Note note, Tag tag) {
        NoteTag noteTag = new NoteTag();
        noteTag.id = new NoteTagId(note.getId(), tag.getId());
        noteTag.note = note;
        noteTag.tag = tag;
        return noteTag;
    }
}
